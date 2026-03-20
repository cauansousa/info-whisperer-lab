import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 py-4">
        <div className="container mx-auto max-w-4xl px-6 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-lg font-semibold">
              Knowledge <span className="text-primary">AI</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 20, 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>
              Knowledge AI ("we", "our", or "us") is operated by Cauan Sousa. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our platform at{" "}
              <span className="text-foreground">knowledge.cauansousa.com</span> (the "Service").
            </p>
            <p className="mt-3">
              By using the Service, you agree to the collection and use of information in accordance with this policy.
              If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-semibold text-foreground mb-2">2.1 Account Information</h3>
            <p>
              When you register, we collect your email address and any profile information you provide through Supabase Auth.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">2.2 Documents and Knowledge Content</h3>
            <p>
              Files you upload (PDF, DOCX, XLSX, CSV) are processed to extract text and generate vector embeddings for
              semantic search. The original files are not permanently stored — only the extracted text chunks and their
              embeddings are retained to power the AI search functionality.
            </p>
            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">2.3 Google Drive Data</h3>
            <p>
              If you choose to connect your Google Drive account, we request the{" "}
              <span className="text-foreground font-mono text-xs bg-secondary/40 px-1.5 py-0.5 rounded">
                https://www.googleapis.com/auth/drive.readonly
              </span>{" "}
              scope. This allows us to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Read the contents of files in folders you explicitly select</li>
              <li>List files within those folders</li>
              <li>Periodically sync changes to keep your knowledge base up to date</li>
            </ul>
            <p className="mt-3">
              We do <strong className="text-foreground">not</strong>:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access, read, or store any files outside the folders you explicitly authorize</li>
              <li>Modify, delete, or share any files in your Google Drive</li>
              <li>Transfer your Google Drive data to third parties</li>
              <li>Use your Google Drive data to train AI models</li>
            </ul>
            <p className="mt-3">
              Google Drive access tokens and refresh tokens are stored securely in our database and used solely to
              perform the file synchronization you configured. You can revoke access at any time through Google's
              security settings or directly within Knowledge AI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process and index documents to enable AI-powered search and question answering</li>
              <li>Synchronize content from connected Google Drive folders</li>
              <li>Authenticate users and manage access control within your organization</li>
              <li>Improve and develop new features of the Service</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or rent your personal information or your documents to third parties.
            </p>
            <p className="mt-3">We may share information only in the following circumstances:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong className="text-foreground">Service Providers:</strong> With trusted providers such as Supabase
                (database and authentication), OpenAI (embedding generation), and cloud infrastructure providers,
                solely to operate the Service.
              </li>
              <li>
                <strong className="text-foreground">Legal Requirements:</strong> If required by law or to protect our
                rights and the safety of our users.
              </li>
              <li>
                <strong className="text-foreground">Organizational Access:</strong> Within your organization (tenant),
                document content is accessible to users you explicitly grant permission to through the platform's
                access controls.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the Service.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Document chunks and embeddings are deleted when you delete a document or library</li>
              <li>Google Drive credentials are deleted immediately when you disconnect the integration</li>
              <li>Account data is retained until you request account deletion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights and Controls</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Delete your documents, libraries, and account data at any time</li>
              <li>Revoke Google Drive access at any time through the platform or through your Google Account</li>
              <li>Request complete account deletion by contacting us</li>
            </ul>
            <p className="mt-3">
              To revoke Google Drive access via Google:{" "}
              <span className="text-foreground">myaccount.google.com/permissions</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Security</h2>
            <p>
              We implement industry-standard security measures including encrypted connections (HTTPS/TLS),
              row-level security in our database, and token-based authentication. However, no method of transmission
              over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Children's Privacy</h2>
            <p>
              The Service is not directed at individuals under the age of 16. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              posting the new policy on this page with an updated date. Continued use of the Service after changes
              constitutes your acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-3 rounded-lg border border-border/40 bg-secondary/20 p-4">
              <p className="text-foreground font-medium">Knowledge AI</p>
              <p>Email: <a href="mailto:cauanvinicius00@gmail.com" className="text-primary hover:underline">cauanvinicius00@gmail.com</a></p>
              <p>Website: <span className="text-foreground">knowledge.cauansousa.com</span></p>
            </div>
          </section>

          <section className="border-t border-border/30 pt-8">
            <p className="text-xs text-muted-foreground/60">
              Knowledge AI's use and transfer of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Knowledge AI. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
