import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
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
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 20, 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Knowledge AI ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>
              Knowledge AI is a platform that allows organizations to build AI-powered knowledge bases from their
              documents and data sources. The Service enables users to upload documents, connect external sources
              such as Google Drive, and query that knowledge using natural language.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
            <p>
              You must create an account to use the Service. You are responsible for maintaining the confidentiality
              of your credentials and for all activities that occur under your account. You agree to notify us
              immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Upload, store, or process content that is illegal, harmful, or infringes on third-party rights</li>
              <li>Attempt to circumvent security controls or access controls</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Use the Service for any purpose other than its intended knowledge management functionality</li>
              <li>Reverse engineer or attempt to extract the source code of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Content and Data</h2>
            <p>
              You retain ownership of all content you upload to the Service. By uploading content, you grant us a
              limited license to process, store, and index that content solely for the purpose of providing the Service
              to you.
            </p>
            <p className="mt-3">
              You are solely responsible for ensuring you have the rights to upload and process any content through
              the Service, including content synchronized from third-party sources such as Google Drive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Google Drive Integration</h2>
            <p>
              When you connect your Google Drive account, you authorize Knowledge AI to access files in folders you
              explicitly select, solely for the purpose of indexing that content into your knowledge base. You may
              revoke this access at any time through the platform or through your Google Account settings at{" "}
              <span className="text-foreground">myaccount.google.com/permissions</span>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive
              property of Knowledge AI and its licensors. Our trademarks and trade dress may not be used in connection
              with any product or service without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind,
              either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or
              completely secure. AI-generated responses may be inaccurate — always verify critical information
              against the original source documents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Knowledge AI shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your use of or inability to use the Service,
              even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service at our sole discretion, without prior notice,
              for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              You may terminate your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes.
              Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact</h2>
            <p>For questions about these Terms, contact us at:</p>
            <div className="mt-3 rounded-lg border border-border/40 bg-secondary/20 p-4">
              <p className="text-foreground font-medium">Knowledge AI</p>
              <p>Email: <a href="mailto:cauanvinicius00@gmail.com" className="text-primary hover:underline">cauanvinicius00@gmail.com</a></p>
              <p>Website: <span className="text-foreground">knowledge.cauansousa.com</span></p>
            </div>
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
