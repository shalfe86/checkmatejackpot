import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollText, Globe, Scale, DollarSign, ShieldAlert, Gavel } from 'lucide-react';

export const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Effective Date: [Insert Date]</p>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          These Terms of Service (“Terms”) constitute a binding legal agreement between you (“User,” “Player,” “You”) and Checkmate Jackpot LLC (“Company,” “We,” “Us,” “Our”). By accessing or using the Checkmate Jackpot platform (“Platform”), you acknowledge that you have read, understood, and agree to be bound by these Terms.
        </p>
      </div>

      {/* 1. Eligibility */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">1.</span> Eligibility
        </h2>
        <div className="space-y-3 text-muted-foreground">
          <p><strong>1.1 Age Requirement:</strong> Users must be at least 18 years old or the age of legal majority in their jurisdiction, whichever is greater.</p>
          <p><strong>1.2 Legal Jurisdiction:</strong> Users may only participate from regions where skill-based competitions with monetary payouts are lawful.</p>
          <p><strong>1.3 Restricted Countries:</strong> The Platform does not permit participation from the following regions: Cuba, Iran, North Korea, Syria, Russia, Belarus, Crimea, Donetsk, Luhansk, Myanmar, Sudan, South Sudan, Nigeria, Ghana, Pakistan, Bangladesh, Kenya, Uganda, and any other jurisdiction where prize competitions are prohibited.</p>
        </div>
      </section>

      {/* 2. Account Registration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">2.</span> Account Registration
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li><strong>Accuracy:</strong> You must provide accurate, complete information. False info may result in termination.</li>
          <li><strong>One Account Limit:</strong> Each individual may operate only one account.</li>
          <li><strong>Security:</strong> You are responsible for maintaining the confidentiality of your credentials.</li>
        </ul>
      </section>

      {/* 3. Gameplay & Tiers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">3.</span> Gameplay & Tiers
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
           <Card className="bg-card/50">
             <CardHeader className="pb-2"><CardTitle className="text-base">Free Tier</CardTitle></CardHeader>
             <CardContent className="text-sm text-muted-foreground space-y-1">
               <p>• No sign-up required</p>
               <p>• No payouts</p>
               <p>• Contains ads</p>
               <p>• 40s start, +2s inc, max 50s</p>
             </CardContent>
           </Card>
           <Card className="bg-primary/5 border-primary/20">
             <CardHeader className="pb-2"><CardTitle className="text-base text-primary">Starter (Tier 2)</CardTitle></CardHeader>
             <CardContent className="text-sm text-muted-foreground space-y-1">
               <p>• $1 entry</p>
               <p>• Capped at $1,000</p>
               <p>• 1 win per month limit</p>
               <p>• 30s start, +2s inc, max 35s</p>
             </CardContent>
           </Card>
           <Card className="bg-gradient-to-br from-background to-secondary/30 border-primary/30">
             <CardHeader className="pb-2"><CardTitle className="text-base text-primary">World (Tier 3)</CardTitle></CardHeader>
             <CardContent className="text-sm text-muted-foreground space-y-1">
               <p>• $2 entry</p>
               <p>• Uncapped Jackpot</p>
               <p>• Unlimited wins</p>
               <p>• 25s start, +1s inc, max 25s</p>
             </CardContent>
           </Card>
        </div>
        <p className="text-sm text-muted-foreground italic">Note: A draw counts as a loss for jackpot purposes.</p>
      </section>

      {/* 4. Awarding */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">4.</span> Jackpot Awarding
        </h2>
        <p className="text-muted-foreground">
          If multiple games finish in close proximity, the jackpot is awarded to the <strong>earliest-started winning game</strong>. Later games will display “Pending Jackpot Verification.” After awarding, Tier 2 resets to $5, and Tier 3 continues growing if applicable.
        </p>
      </section>

      {/* 5 & 6. Verification & Tax */}
      <div className="grid md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-primary">5.</span> Verification (KYC)
          </h2>
          <p className="text-muted-foreground text-sm">
            To claim any payout, users must complete identity verification. This includes providing government-issued ID, legal name, address, and SSN (for U.S. players). Failure to verify results in forfeiture.
          </p>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-primary">6.</span> Tax Reporting
          </h2>
          <div className="text-muted-foreground text-sm space-y-2">
            <p><strong>U.S. Players:</strong> Winnings of $600+ are reported to the IRS via Form 1099-MISC.</p>
            <p><strong>Intl. Players:</strong> Responsible for reporting winnings to local tax authorities.</p>
          </div>
        </section>
      </div>

      {/* 7. Payout Structure */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">7.</span> Payout Structure
        </h2>
        <Card className="border-border bg-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><DollarSign className="w-5 h-5 text-green-500"/> Payment Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                    Prizes under $5,000 are eligible for instant payout. Larger prizes follow the schedule below.
                </p>
                <div className="grid gap-3 text-sm">
                    <div className="p-3 rounded bg-secondary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-bold">Under $5,000</span>
                        <span className="text-muted-foreground font-semibold text-primary">Instant Payout (Subject to Review)</span>
                    </div>
                    <div className="p-3 rounded bg-secondary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-bold">$5,000 – $20,000</span>
                        <span className="text-muted-foreground text-right">Full lump-sum within 15 days</span>
                    </div>
                    <div className="p-3 rounded bg-secondary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-bold">$20,000 – $50,000</span>
                        <span className="text-muted-foreground text-right">4 Quarterly payments (1 yr) OR 65% lump-sum</span>
                    </div>
                    <div className="p-3 rounded bg-secondary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-bold">$50,000 – $100,000</span>
                        <span className="text-muted-foreground text-right">8 Quarterly payments (2 yrs) OR 65% lump-sum</span>
                    </div>
                    <div className="p-3 rounded bg-secondary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-bold">$100,000 – $1M</span>
                        <span className="text-muted-foreground text-right">5 Annual payments OR 65% lump-sum</span>
                    </div>
                    <div className="p-3 rounded bg-secondary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-bold">$1M – $10M</span>
                        <span className="text-muted-foreground text-right">10 Annual payments OR 60% lump-sum</span>
                    </div>
                    <div className="p-3 rounded bg-secondary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-bold">$10M – $50M</span>
                        <span className="text-muted-foreground text-right">20 Annual payments OR 55% lump-sum</span>
                    </div>
                    <div className="p-3 rounded bg-secondary/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-bold">$50M+</span>
                        <span className="text-muted-foreground text-right">30 Annual payments OR 50% lump-sum</span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </section>

      {/* 8. Fraud & Anti-Cheat */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">8.</span> Fraud & Anti-Cheat Policy
        </h2>
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <h3 className="font-bold text-destructive mb-2 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Strict Prohibition</h3>
            <p className="text-muted-foreground text-sm mb-3">
                Engine assistance or external help is strictly prohibited. Indicators include engine-like accuracy, abnormal timing, performance spikes, or matching top lines.
            </p>
            <p className="text-sm font-semibold text-destructive">Violations result in: Winnings withheld, account suspension, or permanent bans.</p>
        </div>
      </section>

      {/* 9. Credits & Payments */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">9.</span> Credits & Payments
        </h2>
        <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
            <li>Minimum credit purchase: $10.</li>
            <li>Credits are non-refundable.</li>
            <li>Tier 2 entry: 1 credit. Tier 3 entry: 2 credits.</li>
            <li>Chargebacks or disputed transactions may result in account termination.</li>
        </ul>
      </section>

      {/* 10-14. Misc Legal */}
      <section className="space-y-8 border-t border-border pt-8">
        <div>
            <h3 className="text-lg font-bold mb-2">10. International Restrictions</h3>
            <p className="text-sm text-muted-foreground">Users are responsible for complying with laws in their region. We may restrict access if participation is illegal or payment cannot be delivered.</p>
        </div>
        <div>
            <h3 className="text-lg font-bold mb-2">11. Intellectual Property</h3>
            <p className="text-sm text-muted-foreground">All Platform content, branding, and software are owned by the Company. No copying or reverse engineering allowed.</p>
        </div>
        <div>
            <h3 className="text-lg font-bold mb-2">12. Account Termination</h3>
            <p className="text-sm text-muted-foreground">We may suspend or terminate any account for cheating, fraud, chargebacks, abuse, or violations of these Terms.</p>
        </div>
        <div>
            <h3 className="text-lg font-bold mb-2">13. Disclaimers</h3>
            <p className="text-sm text-muted-foreground">The Platform is provided “AS IS”. We do not guarantee uninterrupted access, AI behavior, jackpot size, or any particular outcome.</p>
        </div>
        <div>
            <h3 className="text-lg font-bold mb-2">14. Limitation of Liability</h3>
            <p className="text-sm text-muted-foreground">Maximum liability shall not exceed the entry fee for the game in question. We are not liable for lost winnings, technical malfunctions, or indirect damages.</p>
        </div>
      </section>

      {/* 15. Arbitration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">15.</span> Arbitration & Governing Law
        </h2>
        <div className="flex items-start gap-3 p-4 bg-secondary/20 rounded-lg">
            <Gavel className="w-6 h-6 text-foreground mt-1" />
            <p className="text-sm text-muted-foreground">
                These Terms are governed by the laws of the State of Delaware. All disputes will be resolved through <strong>binding arbitration</strong> in Delaware. Users waive the right to participate in class-action lawsuits.
            </p>
        </div>
      </section>

      {/* 16. Changes */}
      <section className="space-y-4 pb-12">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">16.</span> Changes to Terms
        </h2>
        <p className="text-muted-foreground">
            We may update these Terms at any time. Continued use of the Platform constitutes acceptance of the updated Terms.
        </p>
      </section>

    </div>
  );
};