import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Pilot",
  description: "Privacy policy for Pilot, covering LGPD and GDPR compliance.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-content">
        <Link href="/" className="legal-back">&larr; Back to home</Link>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated: June 2026</p>

        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Pilot (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI marketing campaign platform, in compliance with the Brazilian General Data Protection Law (LGPD - Lei Geral de Prote&ccedil;&atilde;o de Dados, Law No. 13.709/2018) and the European Union General Data Protection Regulation (GDPR - Regulation (EU) 2016/679).
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Data Controller</h2>
          <p>
            The data controller for Pilot is the project maintainer. For privacy-related inquiries, you may contact us through the project repository.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Information We Collect</h2>
          <p>Pilot collects the following types of information:</p>
          <ul>
            <li><strong>Campaign Data:</strong> Brand names, product descriptions, campaign goals, audience segments, budget ranges, channel selections, creator criteria, and other brief information you voluntarily provide.</li>
            <li><strong>Usage Data:</strong> Browser type, access times, pages viewed, and interaction patterns within the platform.</li>
            <li><strong>Technical Data:</strong> IP address, device information, and operating system for security and analytics purposes.</li>
          </ul>
          <p>
            <strong>Local Storage:</strong> Campaign data is primarily stored in your browser&rsquo;s localStorage. This data remains on your device and is not transmitted to our servers.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Pilot platform</li>
            <li>Process campaign briefs and generate AI-powered recommendations</li>
            <li>Communicate with configured AI providers (Anthropic, OpenAI-compatible) on your behalf</li>
            <li>Ensure platform security and prevent abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Legal Basis for Processing (GDPR)</h2>
          <p>Under GDPR, we process personal data based on:</p>
          <ul>
            <li><strong>Consent (Art. 6(1)(a)):</strong> When you voluntarily provide campaign data and agree to this policy.</li>
            <li><strong>Legitimate Interest (Art. 6(1)(f)):</strong> For platform security, analytics, and improvement.</li>
            <li><strong>Contract (Art. 6(1)(b)):</strong> To provide the services you request.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Legal Basis for Processing (LGPD)</h2>
          <p>Under LGPD, we process personal data based on:</p>
          <ul>
            <li><strong>Consent (Art. 7, I):</strong> When you explicitly agree to data processing.</li>
            <li><strong>Legitimate Interest (Art. 7, IX):</strong> For platform improvement and security.</li>
            <li><strong>Execution of Contract (Art. 7, V):</strong> To provide requested services.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Data Sharing and Third Parties</h2>
          <p>
            Campaign brief data may be sent to your configured AI provider (Anthropic, OpenAI-compatible endpoint, or mock) for processing. We do not sell, trade, or rent your personal information to third parties. Data shared with AI providers is subject to their respective privacy policies.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Data Retention</h2>
          <p>
            Campaign data stored in localStorage persists until you clear your browser data or delete specific campaigns. Server-side logs, if any, are retained for a maximum of 12 months.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Your Rights</h2>
          <p>Under both LGPD and GDPR, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data.</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
            <li><strong>Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Request deletion of your personal data.</li>
            <li><strong>Restriction:</strong> Limit how we process your data.</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format.</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent at any time without affecting prior processing.</li>
          </ul>
          <p>
            To exercise these rights, contact us through the project repository or delete your data directly by clearing your browser&rsquo;s localStorage.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. International Data Transfers</h2>
          <p>
            If you use an AI provider located outside your country, your campaign data may be transferred internationally. We ensure that such transfers comply with applicable data protection laws, including LGPD Chapter V and GDPR Chapter V requirements.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Children&rsquo;s Privacy</h2>
          <p>
            Pilot is not intended for users under 16 years of age (or 13 in the US, 18 in Brazil for certain data processing). We do not knowingly collect personal data from children.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Changes will be posted on this page with an updated revision date. Continued use of the platform constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Contact</h2>
          <p>
            For privacy-related questions or to exercise your rights, please contact us through the project repository at{" "}
            <a href="https://github.com/anomalyco/opencode/issues" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
