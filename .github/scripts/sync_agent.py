#!/usr/bin/env python3
"""
Branch Sync Agent
Analyzes commits and decides whether to replicate them to the other branch via PR.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

import anthropic
import requests

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
SOURCE_BRANCH = os.environ["SOURCE_BRANCH"]
REPO = os.environ["REPO"]
COMMIT_SHA = os.environ["COMMIT_SHA"]
COMMIT_MESSAGE = os.environ["COMMIT_MESSAGE"]
TARGET_BRANCH = "local-deploy" if SOURCE_BRANCH == "main" else "main"


def run(cmd):
    """Run a shell command and return (stdout+stderr combined, returncode)."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    combined = (result.stdout + result.stderr).strip()
    return combined, result.returncode


def get_commit_diff():
    diff, _ = run(f"git diff {COMMIT_SHA}^..{COMMIT_SHA}")
    return diff


def get_changed_files():
    output, _ = run(f"git diff --name-only {COMMIT_SHA}^..{COMMIT_SHA}")
    return output.split("\n") if output else []


def load_repo_context():
    context_path = Path(".github/scripts/repo_context.md")
    if context_path.exists():
        return context_path.read_text()
    return ""


def analyze_with_claude(diff, changed_files, commit_message, extra_instruction=""):
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    repo_context = load_repo_context()

    # Truncate very large diffs to avoid token limits
    if len(diff) > 12000:
        diff = diff[:12000] + "\n\n[diff truncated...]"

    prompt = f"""You are a code sync agent. This project has two branches:
- `main`: cloud/web deployment
- `local-deploy`: offline/local deployment

## Repository Context
{repo_context}

## Commit to analyze
- Source branch: `{SOURCE_BRANCH}`
- Target branch: `{TARGET_BRANCH}`
- Commit SHA: {COMMIT_SHA[:7]}
- Commit message: {commit_message}
- Changed files: {", ".join(changed_files)}

## Diff
```diff
{diff}
```

{extra_instruction}

## Task
Decide if this commit should be replicated to `{TARGET_BRANCH}`.

**Replicate** when: bug fixes, new features, UX improvements that are not deployment-specific.
**Adapt** when: the change is valid for both branches but needs small modifications (e.g., removing localhost-specific parts).
**Ignore** when: changes are purely deployment-specific (Dockerfile, .env files, localhost URLs, Ollama logic, local inference config).

Respond with ONLY a raw JSON object (no markdown fences):
{{
  "action": "ignore" | "replicate" | "adapt",
  "rationale": "one sentence explaining why",
  "pr_title": "concise PR title (required if action != ignore)",
  "pr_body": "PR description explaining what was synced and why (required if action != ignore)",
  "adapted_files": [
    {{
      "path": "relative/path/to/file",
      "content": "complete file content after adaptation"
    }}
  ]
}}

`adapted_files` is only needed when action == "adapt". When adapting, always include the FULL file content, not just the changed parts.
"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=16000,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()

    # Extract the JSON object robustly — ignore any text before/after it
    start = response_text.find("{")
    end = response_text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON object found in Claude response:\n{response_text}")
    response_text = response_text[start:end]

    return json.loads(response_text)


def create_pr(new_branch, pr_title, pr_body):
    url = f"https://api.github.com/repos/{REPO}/pulls"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    data = {
        "title": pr_title,
        "body": pr_body,
        "head": new_branch,
        "base": TARGET_BRANCH,
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 201:
        pr_url = response.json()["html_url"]
        print(f"PR created: {pr_url}")
        return pr_url
    elif response.status_code == 422:
        # PR already exists or no commits to sync
        err = response.json()
        print(f"PR not created (already exists or no diff): {err.get('message', '')}")
        return None
    else:
        print(f"Failed to create PR: {response.status_code} {response.text}")
        return None


def handle_replicate(pr_title, pr_body):
    """
    Returns:
        True  — sync succeeded (PR created or changes already present)
        False — unrecoverable error (push failed, etc.)
        None  — cherry-pick had conflicts; caller should try adapt mode
    """
    short_sha = COMMIT_SHA[:7]
    new_branch = f"sync/{SOURCE_BRANCH}-to-{TARGET_BRANCH}/{short_sha}"

    run(f"git fetch origin {TARGET_BRANCH}")
    run(f"git checkout -b {new_branch} origin/{TARGET_BRANCH}")

    out, code = run(f"git cherry-pick {COMMIT_SHA}")
    if code != 0:
        # Already merged / empty cherry-pick
        if "nothing to commit" in out or "empty" in out.lower():
            print("Changes already present in target branch, nothing to sync.")
            run("git cherry-pick --skip")
            return True

        # Conflict — abort cleanly and signal caller to try adapt mode
        print(f"Cherry-pick conflict detected. Aborting and falling back to adapt mode.")
        print(f"Git output: {out[:500]}")
        run("git cherry-pick --abort")
        return None  # Signal: retry with adapt

    _, push_code = run(f"git push origin {new_branch}")
    if push_code != 0:
        print("Push failed.")
        return False

    create_pr(new_branch, pr_title, pr_body)
    return True


def handle_adapt(adapted_files, pr_title, pr_body):
    short_sha = COMMIT_SHA[:7]
    new_branch = f"sync/{SOURCE_BRANCH}-to-{TARGET_BRANCH}/{short_sha}"

    # Branch may already exist from a failed replicate attempt — delete and recreate
    run(f"git branch -D {new_branch} 2>/dev/null || true")
    run(f"git fetch origin {TARGET_BRANCH}")
    run(f"git checkout -b {new_branch} origin/{TARGET_BRANCH}")

    for file_info in adapted_files:
        path = Path(file_info["path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(file_info["content"])
        run(f"git add {file_info['path']}")

    # Check if there is actually anything to commit
    status_out, _ = run("git status --porcelain")
    if not status_out:
        print("Adapted files match target branch exactly — nothing to commit.")
        return True

    short_msg = COMMIT_MESSAGE.split("\n")[0][:72]
    commit_msg = f"sync: {short_msg}\n\nAdapted from `{SOURCE_BRANCH}` commit {COMMIT_SHA[:7]}."
    run(f'git commit -m "{commit_msg}"')

    _, push_code = run(f"git push origin {new_branch}")
    if push_code != 0:
        print("Push failed.")
        return False

    create_pr(new_branch, pr_title, pr_body)
    return True


def main():
    print(f"=== Branch Sync Agent ===")
    print(f"Commit : {COMMIT_SHA[:7]} on `{SOURCE_BRANCH}`")
    print(f"Message: {COMMIT_MESSAGE.split(chr(10))[0]}")
    print(f"Target : `{TARGET_BRANCH}`")

    diff = get_commit_diff()
    changed_files = get_changed_files()

    if not diff:
        print("No diff found, skipping.")
        return

    print(f"Files  : {', '.join(changed_files)}")
    print("Calling Claude API...")

    try:
        decision = analyze_with_claude(diff, changed_files, COMMIT_MESSAGE)
    except json.JSONDecodeError as e:
        print(f"Failed to parse Claude response as JSON: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Claude API error: {e}")
        sys.exit(1)

    action = decision.get("action", "ignore")
    rationale = decision.get("rationale", "")
    print(f"Decision: {action.upper()} — {rationale}")

    if action == "ignore":
        print("Nothing to sync.")
        return

    pr_title = decision.get("pr_title") or f"sync: {COMMIT_MESSAGE.split(chr(10))[0][:60]}"
    pr_body = decision.get("pr_body") or (
        f"Synced from `{SOURCE_BRANCH}` commit {COMMIT_SHA[:7]}.\n\n**Rationale:** {rationale}"
    )

    success = False

    if action == "replicate":
        result = handle_replicate(pr_title, pr_body)

        if result is None:
            # Cherry-pick had conflicts — ask Claude to produce adapted content
            print("Cherry-pick failed. Asking Claude to produce adapted content...")
            try:
                adapt_decision = analyze_with_claude(
                    diff,
                    changed_files,
                    COMMIT_MESSAGE,
                    extra_instruction=(
                        "IMPORTANT: Cherry-pick of this commit failed due to conflicts "
                        f"with `{TARGET_BRANCH}`. You MUST respond with action='adapt' "
                        "and provide `adapted_files` with the complete file content as "
                        f"it should look in `{TARGET_BRANCH}` after applying this change."
                    ),
                )
                adapt_action = adapt_decision.get("action", "ignore")
                adapted_files = adapt_decision.get("adapted_files") or []

                if adapt_action == "ignore":
                    print("Claude decided to ignore after conflict — skipping.")
                    success = True  # Not a failure, just nothing to sync
                elif adapted_files:
                    print(f"Applying adapted content for {len(adapted_files)} file(s)...")
                    success = handle_adapt(adapted_files, pr_title, pr_body)
                    if not success:
                        # Don't fail the workflow — sync just couldn't be done automatically
                        print("Adapt also failed. Skipping — manual sync may be needed.")
                        success = True
                else:
                    print("Claude returned no adapted_files. Skipping.")
                    success = True  # Not a failure

            except Exception as e:
                print(f"Adapt fallback error: {e}. Skipping.")
                success = True  # Don't fail the workflow over this

        else:
            success = result if result is not None else True

    elif action == "adapt":
        adapted_files = decision.get("adapted_files") or []
        if not adapted_files:
            print("No adapted_files provided by Claude, falling back to replicate.")
            result = handle_replicate(pr_title, pr_body)
            success = True if result is None else bool(result)
        else:
            success = handle_adapt(adapted_files, pr_title, pr_body)
    else:
        print(f"Unknown action: {action}")
        success = True

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
