import { useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { colors, space, type as typeTokens } from '@/design/tokens'

export function PrivacyTermsScreenContent({ onClose }: { onClose?: () => void } = {}) {
  const router = useRouter()

  return (
    <SettingsDetailShell title="Privacy & Terms" onBack={onClose ?? (() => router.back())} contentStyle={styles.content}>
      <Text style={styles.meta}>Last updated: May 20, 2026</Text>

      <DocBody>
        This page covers both our Privacy Policy and Terms of Use for WildKind, operated by Celestial Works LLC. By using WildKind, you agree to the practices and terms described below.
      </DocBody>

      {/* ─── Privacy Policy ─────────────────────────────────────── */}
      <DocH1>Privacy Policy</DocH1>

      <DocH2>1. Introduction</DocH2>
      <DocBody>
        WildKind is a nature discovery app that helps users identify animals, plants, and other wildlife through photos, location-based discovery, educational content, maps, journaling, and AI-powered suggestions.
      </DocBody>
      <DocBody>
        This Privacy Policy explains how WildKind collects, uses, stores, and shares information when you use our mobile app, website, features, services, or related products.
      </DocBody>
      <DocBody>
        By using WildKind, you agree to the practices described in this Privacy Policy.
      </DocBody>

      <DocH2>2. Information We Collect</DocH2>
      <DocBody>
        We may collect the following types of information depending on how you use WildKind. We try to collect only what is needed to provide the app, keep users safe, improve identification, prevent abuse, and support account features.
      </DocBody>
      <DocSubhead>Birthday and Age Information</DocSubhead>
      <DocBody>
        When you create an account or begin using WildKind, we may ask for your birthday or age range. We use this to help determine whether you are old enough to use WildKind on your own or whether parent or legal guardian permission is required.
      </DocBody>
      <DocBody>
        If a user is under 13, WildKind may limit or block regular account creation until a parent or legal guardian gives permission, where required by law.
      </DocBody>
      <DocSubhead>Account Information</DocSubhead>
      <DocBody>When you create an account or join our waitlist, we may collect:</DocBody>
      <DocBullets items={[
        'Name',
        'Email address',
        'Login provider information, such as Apple or Google login',
        'Subscription status',
        'Account settings',
        'Public or private profile preferences',
      ]} />
      <DocSubhead>Photos, Videos, and Uploaded Content</DocSubhead>
      <DocBody>If you upload or capture photos through WildKind, we may collect:</DocBody>
      <DocBullets items={[
        'Photos or videos you choose to upload',
        'Image metadata, when available',
        'Species identification results',
        'Notes, captions, journal entries, and saved observations',
        'Whether the content is marked public or private',
      ]} />
      <DocSubhead>Location Information</DocSubhead>
      <DocBody>
        WildKind may use location data to help identify nearby wildlife, show sightings on a map, provide location-based suggestions, and improve species identification accuracy.
      </DocBody>
      <DocBody>Location information may include:</DocBody>
      <DocBullets items={[
        'Approximate location',
        'GPS location, if you allow precise location access',
        'Location attached to a photo or observation',
        'City, region, or country search information',
      ]} />
      <DocSubhead>AI Identification and Wildlife Data</DocSubhead>
      <DocBody>WildKind may use AI and third-party data sources to help identify animals, plants, and other species. This may include:</DocBody>
      <DocBullets items={[
        'Photo analysis',
        'Visual recognition results',
        'Suggested species names',
        'Confidence scores',
        'Educational information',
        'Public biodiversity data, such as GBIF records',
      ]} />
      <DocSubhead>Payment and Subscription Information</DocSubhead>
      <DocBody>
        If you purchase a subscription or paid feature, payment may be processed through Apple, Google, Stripe, or another payment provider. WildKind does not directly store full credit card numbers.
      </DocBody>
      <DocBody>We may receive limited subscription information, such as:</DocBody>
      <DocBullets items={[
        'Subscription plan',
        'Purchase status',
        'Renewal status',
        'Trial status',
        'Transaction identifiers',
      ]} />
      <DocSubhead>Device and Usage Information</DocSubhead>
      <DocBody>We may collect technical and usage information, including:</DocBody>
      <DocBullets items={[
        'Device type',
        'Operating system',
        'App version',
        'Crash logs',
        'Performance data',
        'Features used',
        'General usage activity',
        'Error reports',
      ]} />

      <DocH2>3. How We Use Your Information</DocH2>
      <DocBody>We use information to:</DocBody>
      <DocBullets items={[
        'Create and manage your account',
        'Provide wildlife, plant, and animal identification',
        'Show nearby observations and map features',
        'Save your journal entries, badges, captures, and collections',
        'Provide educational content',
        'Personalize your experience',
        'Process subscriptions and payments',
        'Improve app performance and safety',
        'Prevent spam, fraud, abuse, and misuse',
        'Respond to support requests',
        'Send important service updates',
        'Comply with legal obligations',
      ]} />

      <DocH2>4. Public and Private Content</DocH2>
      <DocBody>
        WildKind may allow users to choose whether certain observations, photos, journals, or captures are public or private.
      </DocBody>
      <DocBody>Private content is intended to be visible only to you or people you choose to share it with.</DocBody>
      <DocBody>Public content may be visible to other WildKind users and may include information such as:</DocBody>
      <DocBullets items={[
        'Uploaded photo',
        'Species name',
        'General location, if shared',
        'Date of observation',
        'Username or profile information',
        'Notes or captions you choose to make public',
      ]} />

      <DocH2>5. Location Safety and Trespassing</DocH2>
      <DocBody>
        WildKind may provide maps, directions, nearby discovery, and species location information. This does not give users permission to enter private property, restricted land, closed areas, protected areas, national parks, state parks, wildlife preserves, fenced areas, or unsafe locations.
      </DocBody>
      <DocBody>
        Users must stay within public areas where they are legally allowed to be. Users should never cross signs, gates, fences, barriers, ropes, or restricted boundaries to take a photo or find a species.
      </DocBody>
      <DocBody>
        Users are responsible for following local laws, posted signs, park rules, wildlife protection rules, and property boundaries. If you are unsure whether an area is public, safe, open, or legally accessible, do not enter.
      </DocBody>
      <DocBody>
        WildKind encourages users to observe animals from a safe distance. Do not approach unknown animals, wild animals, injured animals, nesting animals, or animals that may be dangerous. Use zoom and take photos from a distance.
      </DocBody>

      <DocH2>6. Children's Privacy</DocH2>
      <DocBody>
        WildKind may be used by families and children with adult supervision. Children under 13 may not download, create an account, or use WildKind without permission and supervision from a parent or legal guardian.
      </DocBody>
      <DocBody>
        When a user begins using WildKind, we may ask for the user's birthday or age range. If the user is under 13, WildKind may limit regular sign-up options and require a parent or legal guardian's permission before the child can use the app, where required by law.
      </DocBody>
      <DocBody>
        If WildKind is made available to children under 13, we will follow applicable children's privacy laws, including COPPA in the United States.
      </DocBody>
      <DocBody>
        We do not knowingly collect personal information from children under 13 without appropriate parental consent where required by law.
      </DocBody>
      <DocBody>
        For children under 13, parent or legal guardian permission may be required before WildKind collects or uses personal information, photos, location information, device information, uploaded observations, or other account information.
      </DocBody>
      <DocBody>
        Parents and legal guardians are responsible for deciding whether WildKind is appropriate for their child. If a parent or guardian allows a child under 18 to use WildKind, the parent or guardian is responsible for the child's use of the app, including the child's safety, location choices, uploaded content, account activity, subscriptions, purchases, and compliance with these rules.
      </DocBody>
      <DocBody>
        Parents or guardians may contact us to request access, correction, export, or deletion of a child's personal information. Parents or guardians may also request that a child's account be deleted or disabled.
      </DocBody>
      <DocBody>
        If we learn that we collected personal information from a child under 13 without required consent, we will take steps to delete it, disable the account, or obtain appropriate consent.
      </DocBody>

      <DocH2>7. How We Share Information</DocH2>
      <DocBody>We do not sell your personal information.</DocBody>
      <DocBody>We may share information with trusted service providers that help us operate WildKind, such as:</DocBody>
      <DocSubhead>Service Providers</DocSubhead>
      <DocBody>These providers are only allowed to use information as needed to provide services to WildKind.</DocBody>
      <DocBullets items={[
        'Cloud hosting providers',
        'Authentication providers',
        'AI model providers',
        'Species and biodiversity data providers',
        'Analytics providers',
        'Crash reporting tools',
        'Payment processors',
        'Customer support tools',
      ]} />
      <DocSubhead>Legal and Safety</DocSubhead>
      <DocBody>We may also share information if required to:</DocBody>
      <DocBullets items={[
        'Comply with law',
        'Respond to legal requests',
        'Protect users, wildlife, property, or safety',
        'Prevent fraud or abuse',
        'Enforce our Terms of Use',
        'Complete a merger, sale, or business transfer',
      ]} />

      <DocH2>8. AI and Third-Party Processing</DocH2>
      <DocBody>
        WildKind may send photos, text, metadata, or identification requests to AI providers or other technical systems to generate species suggestions, educational content, safety warnings, or journaling assistance.
      </DocBody>
      <DocBody>
        AI results are informational only and may be incorrect. Do not use WildKind as your only source for identifying dangerous animals, poisonous plants, edible plants, medical risks, or legal restrictions.
      </DocBody>

      <DocH2>9. AI and Third-Party Information Providers</DocH2>
      <DocBody>
        WildKind may use AI providers, image recognition tools, and biodiversity data sources to provide species identification, educational content, safety notes, journaling support, map-based discovery, and app suggestions.
      </DocBody>
      <DocBody>
        These providers and sources may include Anthropic Claude, OpenAI GPT-4o, Google Cloud Vision, GBIF, and other tools or databases used to operate and improve WildKind.
      </DocBody>
      <DocBody>
        When you upload a photo, submit text, use identification features, or use location-based discovery, certain information may be processed by these systems to provide app results. This may include photos, text, species requests, general location information, device information, and related observation details, depending on the feature used.
      </DocBody>
      <DocBody>
        AI-generated results and third-party data may not always be accurate. WildKind may review, update, correct, or improve information when possible, but we cannot guarantee that every identification, suggestion, warning, or educational result is correct.
      </DocBody>

      <DocH2>10. Data Retention</DocH2>
      <DocBody>
        We keep information for as long as needed to provide WildKind, maintain your account, comply with legal obligations, resolve disputes, and improve the app.
      </DocBody>
      <DocBody>
        You may request deletion of your account or certain personal information by contacting us at hello@wildkind.app. Some information may be retained if required by law, for security, fraud prevention, payment records, or legitimate business purposes.
      </DocBody>

      <DocH2>11. Your Choices</DocH2>
      <DocBody>You may be able to:</DocBody>
      <DocBullets items={[
        'Update your account information',
        'Delete certain uploads or journal entries',
        'Choose whether content is public or private',
        'Turn off device location permissions',
        'Turn off photo permissions',
        'Limit or hide precise location on public observations, where this feature is available',
        'Unsubscribe from marketing emails',
        'Cancel subscriptions through Apple, Google, or the payment provider used',
        'Request account deletion',
        "Request deletion of a child's account or child's personal information if you are the parent or legal guardian",
      ]} />

      <DocH2>12. Security</DocH2>
      <DocBody>
        We use reasonable safeguards to protect your information. However, no app, website, or online service can guarantee perfect security.
      </DocBody>
      <DocBody>
        Please use a strong password, protect your device, and be careful about what you upload or share publicly.
      </DocBody>

      <DocH2>13. International Users</DocH2>
      <DocBody>
        WildKind may be used in different countries. By using WildKind, you understand that your information may be processed in the United States or other locations where our service providers operate.
      </DocBody>

      <DocH2>14. Changes to This Privacy Policy</DocH2>
      <DocBody>
        We may update this Privacy Policy from time to time. If we make material changes, we may notify you through the app, by email, or by updating the date at the top of this policy.
      </DocBody>

      <DocH2>15. Contact Us</DocH2>
      <DocBody>
        For privacy questions, account deletion, or support, contact us at:{'\n\n'}
        Email: hello@wildkind.app{'\n'}
        Company: Celestial Works LLC{'\n'}
        Location: Georgia, United States{'\n'}
        AI providers: Anthropic (Claude), OpenAI (GPT-4o), Google Cloud Vision, GBIF
      </DocBody>

      {/* ─── Terms of Use ────────────────────────────────────────── */}
      <DocH1>Terms of Use</DocH1>

      <DocH2>1. Agreement to Terms</DocH2>
      <DocBody>
        These Terms of Use govern your access to and use of WildKind, including our mobile app, website, features, services, content, subscriptions, and related products.
      </DocBody>
      <DocBody>
        By creating an account, downloading the app, joining the waitlist, purchasing a subscription, or using WildKind, you agree to these Terms.
      </DocBody>
      <DocBody>If you do not agree, do not use WildKind.</DocBody>

      <DocH2>2. About WildKind</DocH2>
      <DocBody>
        WildKind helps users discover, identify, learn about, and document animals, plants, and wildlife. The app may include photo identification, AI-powered suggestions, maps, journaling, badges, educational content, public and private observations, family-friendly features, and premium subscriptions.
      </DocBody>
      <DocBody>
        WildKind is for education, exploration, and personal discovery. It is not a professional wildlife, medical, legal, safety, survival, or emergency service.
      </DocBody>

      <DocH2>3. Eligibility</DocH2>
      <DocBody>
        You must be at least 13 years old to download WildKind, create your own account, or use the app on your own.
      </DocBody>
      <DocBody>
        When you sign up or begin using WildKind, we may ask for your birthday or age range. If you are under 13, regular sign-up options may be limited or blocked, and parent or legal guardian permission may be required before you can use the app.
      </DocBody>
      <DocBody>If you are under 13, you may only use WildKind with permission and supervision from a parent or legal guardian.</DocBody>
      <DocBody>If you are under 18, you may use WildKind only with permission from a parent or legal guardian.</DocBody>
      <DocBody>
        Parents and legal guardians are responsible for deciding whether WildKind is appropriate for their child. If a parent or guardian allows a child under 18 to use WildKind, the parent or guardian accepts responsibility for the child's use of the app, including the child's safety, location choices, uploaded content, account activity, subscriptions, purchases, and compliance with these Terms.
      </DocBody>
      <DocBody>
        WildKind is not responsible for a child's use of the app when a parent or legal guardian has allowed that child to use, access, or download WildKind.
      </DocBody>

      <DocH2>4. Accounts</DocH2>
      <DocBody>You are responsible for keeping your account secure and for all activity under your account.</DocBody>
      <DocBody>
        You agree to provide accurate information and not impersonate another person, create fake accounts, or use another person's account without permission.
      </DocBody>
      <DocBody>
        We may suspend or terminate accounts that violate these Terms or create risk for WildKind, users, wildlife, or the public.
      </DocBody>

      <DocH2>5. User Content</DocH2>
      <DocBody>
        You may be able to upload photos, videos, notes, journal entries, comments, observations, profile information, and other content.
      </DocBody>
      <DocBody>
        You keep ownership of your content. However, by uploading content to WildKind, you give WildKind permission to use, host, store, display, process, analyze, reproduce, and modify your content as needed to provide and improve the app.
      </DocBody>
      <DocBody>
        If you make content public, you also allow WildKind to display it to other users and use it for public discovery features inside the app.
      </DocBody>
      <DocBody>
        You represent that you have the rights needed to upload the content and that your content does not violate the law or anyone else's rights.
      </DocBody>

      <DocH2>6. Content Rules</DocH2>
      <DocBody>You agree not to upload, post, or share content that:</DocBody>
      <DocBullets items={[
        'Is illegal, harmful, abusive, threatening, harassing, hateful, or discriminatory',
        'Sexualizes minors or exploits children in any way',
        "Violates someone's privacy",
        'Shows private homes, schools, children, or other sensitive locations without permission',
        'Encourages animal abuse, wildlife harassment, poaching, trespassing, or unsafe behavior',
        'Contains spam, scams, malware, or misleading information',
        'Violates intellectual property rights',
        'Shares exact locations of endangered species, protected wildlife, nests, dens, or sensitive habitats where doing so may cause harm',
      ]} />

      <DocH2>7. Wildlife, Outdoor Safety, and Property Rules</DocH2>
      <DocBody>
        WildKind may show animals, plants, maps, locations, species ranges, directions, warnings, and educational information. These features are for discovery and education only. They do not give you permission to enter any restricted, unsafe, private, or protected area.
      </DocBody>
      <DocBody>By using WildKind, you agree that:</DocBody>
      <DocBullets items={[
        'You will stay aware of your surroundings while using the app',
        'You will not look at your phone while walking, biking, driving, crossing streets, hiking near cliffs, or moving through unsafe areas',
        'You will stay in public areas where you are legally allowed to be',
        'You will not enter private property, fenced areas, backyards, farms, construction zones, restricted areas, or closed trails',
        'You will not enter national parks, state parks, wildlife preserves, zoos, nature centers, campgrounds, trails, or protected areas unless you have permission and follow all posted rules',
        'You will not cross barriers, signs, gates, ropes, fences, or restricted boundaries to take a photo or find a species',
        'You will follow all local laws, park rules, wildlife rules, trail rules, and property boundaries',
        'You will not approach, touch, feed, chase, disturb, capture, scare, or harm any animal',
        'You will not get close to unknown, wild, injured, sick, nesting, defensive, or dangerous animals',
        'You will take photos from a safe distance only',
        'You will use zoom instead of moving closer to animals or unsafe areas',
        'You will not use WildKind while driving or operating a vehicle',
        'You will not rely on WildKind as your only safety source',
        'You will use caution around wild animals, unknown plants, water, cliffs, roads, weather, and unsafe areas',
        'You are responsible for your own safety and the safety of children, pets, or anyone with you',
      ]} />

      <DocH2>8. AI Identification Disclaimer</DocH2>
      <DocBody>
        WildKind may use AI, image recognition, third-party databases, and user-provided information to suggest species or educational information.
      </DocBody>
      <DocBody>
        AI results can be wrong. Species identification, animal behavior information, plant information, toxicity information, location data, and safety warnings may be incomplete or inaccurate.
      </DocBody>
      <DocBody>
        Do not rely on WildKind to decide whether an animal is dangerous, whether a plant is edible, whether a plant is poisonous, whether an area is safe, or whether a location can be legally accessed.
      </DocBody>
      <DocBody>
        Always use common sense and consult qualified experts, official park staff, medical professionals, poison control, wildlife authorities, or emergency services when needed.
      </DocBody>

      <DocH2>9. Subscriptions, Trials, and Payments</DocH2>
      <DocBody>
        WildKind may offer free features, paid subscriptions, trials, family plans, premium photo uploads, journaling features, badges, AI features, or other paid products.
      </DocBody>
      <DocBody>Prices, features, and limits may change over time.</DocBody>
      <DocBody>
        If you purchase through Apple App Store or Google Play, your subscription is managed by that platform. Cancellations, refunds, renewals, and billing issues are subject to the platform's rules.
      </DocBody>
      <DocBody>
        Free trials may convert to paid subscriptions unless canceled before the trial ends. You are responsible for managing and canceling your subscription through the appropriate platform.
      </DocBody>

      <DocH2>10. Free Plan and Usage Limits</DocH2>
      <DocBody>
        WildKind may offer a free plan with limited features, such as a limited number of monthly photo uploads or restricted access to journaling, AI features, maps, badges, or premium content.
      </DocBody>
      <DocBody>We may change free plan limits at any time.</DocBody>

      <DocH2>11. Intellectual Property</DocH2>
      <DocBody>
        WildKind, including its name, logo, design, software, features, text, graphics, badges, illustrations, interfaces, and other content, is owned by WildKind or its licensors and is protected by intellectual property laws.
      </DocBody>
      <DocBody>You may not copy, modify, sell, rent, reverse engineer, scrape, or misuse WildKind without permission.</DocBody>

      <DocH2>12. Third-Party Services and Data</DocH2>
      <DocBody>
        WildKind may use third-party services, APIs, AI systems, maps, databases, payment processors, login providers, analytics tools, or biodiversity data sources.
      </DocBody>
      <DocBody>
        Third-party services may help us provide login, parental permission, payments, species identification, maps, analytics, crash reporting, safety features, or customer support.
      </DocBody>
      <DocBody>We are not responsible for third-party services, their content, their accuracy, or their policies.</DocBody>

      <DocH2>13. AI, Species Identification, and Information Accuracy</DocH2>
      <DocBody>
        WildKind uses artificial intelligence, image recognition, and third-party data sources to help identify animals, plants, and other species and to provide educational information.
      </DocBody>
      <DocBody>
        Information and suggestions in WildKind may be generated or supported by providers and data sources such as Anthropic Claude, OpenAI GPT-4o, Google Cloud Vision, GBIF, and other tools or databases we may use to operate and improve the app.
      </DocBody>
      <DocBody>
        AI and third-party data sources can make mistakes. Species identification, animal information, plant information, location information, safety warnings, educational content, and other app-generated suggestions may be incomplete, outdated, inaccurate, or misidentified.
      </DocBody>
      <DocBody>
        WildKind is for general information, education, and nature discovery only. Information provided in the app should not be treated as professional, medical, legal, scientific, emergency, survival, or safety advice.
      </DocBody>
      <DocBody>
        Users should not rely on WildKind as the only source for identifying dangerous animals, poisonous plants, edible plants, protected species, invasive species, allergens, diseases, legal access to land, park rules, or emergency situations.
      </DocBody>
      <DocBody>
        We try to provide helpful and accurate information and may update, correct, improve, or remove information when we become aware of errors. However, WildKind does not guarantee that any identification, description, warning, location, or educational information will always be correct.
      </DocBody>
      <DocBody>
        By using WildKind, you understand that AI-generated and third-party information may contain errors, and you agree that WildKind is not responsible for harm, loss, injury, fines, damage, or decisions made based on inaccurate, incomplete, or misunderstood information from the app.
      </DocBody>

      <DocH2>14. Prohibited Use</DocH2>
      <DocBody>You agree not to:</DocBody>
      <DocBullets items={[
        'Use WildKind for illegal activity',
        'Harass, stalk, threaten, or harm others',
        'Abuse, disturb, or exploit animals or wildlife',
        'Trespass or encourage trespassing',
        'Scrape, copy, or harvest data from WildKind',
        'Attempt to hack, disrupt, or overload the app',
        'Use automated bots without permission',
        'Upload harmful code or malware',
        'Misrepresent AI results as professional advice',
        'Use WildKind to locate sensitive wildlife for poaching, trafficking, harassment, or exploitation',
      ]} />

      <DocH2>15. Account Suspension or Termination</DocH2>
      <DocBody>
        We may suspend, restrict, or terminate your access to WildKind if we believe you violated these Terms, created risk, misused the app, or harmed other users, wildlife, or the service.
      </DocBody>
      <DocBody>
        You may stop using WildKind at any time. You may request account deletion by contacting us at hello@wildkind.app.
      </DocBody>

      <DocH2>16. Disclaimers</DocH2>
      <DocBody>WildKind is provided "as is" and "as available."</DocBody>
      <DocBody>We do not guarantee that:</DocBody>
      <DocBullets items={[
        'The app will always be available',
        'AI identification will be accurate',
        'Species information will be complete',
        'Map data will be correct',
        'The app will be free of bugs or errors',
        'Any specific feature will remain available',
      ]} />

      <DocH2>17. Limitation of Liability</DocH2>
      <DocBody>
        To the fullest extent allowed by law, WildKind and its owners, employees, contractors, service providers, and partners will not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of profits, personal injury, property damage, outdoor accidents, wildlife encounters, trespassing consequences, or reliance on inaccurate AI results.
      </DocBody>

      <DocH2>18. Indemnification</DocH2>
      <DocBody>
        You agree to defend, indemnify, and hold WildKind harmless from claims, losses, damages, liabilities, and expenses arising from your use of WildKind, your content, your violation of these Terms, or your violation of any law or third-party rights.
      </DocBody>

      <DocH2>19. Changes to the App or Terms</DocH2>
      <DocBody>
        We may update WildKind or these Terms from time to time. If changes are material, we may notify you through the app, by email, or by updating the date at the top of these Terms.
      </DocBody>
      <DocBody>Your continued use of WildKind after changes means you accept the updated Terms.</DocBody>

      <DocH2>20. Governing Law</DocH2>
      <DocBody>
        These Terms are governed by the laws of the State of Georgia, United States, unless applicable law requires otherwise.
      </DocBody>

      <DocH2>21. Contact</DocH2>
      <DocBody>
        For questions about these Terms, contact us at:{'\n\n'}
        Email: hello@wildkind.app{'\n'}
        Company: Celestial Works LLC{'\n'}
        Location: Georgia, United States{'\n'}
        AI providers: Anthropic (Claude), OpenAI (GPT-4o), Google Cloud Vision, GBIF
      </DocBody>
    </SettingsDetailShell>
  )
}

function DocH1({ children }: { children: string }) {
  return <Text style={styles.h1}>{children}</Text>
}

function DocH2({ children }: { children: string }) {
  return <Text style={styles.h2}>{children}</Text>
}

function DocSubhead({ children }: { children: string }) {
  return <Text style={styles.subhead}>{children}</Text>
}

function DocBody({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>
}

function DocBullets({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space[8],
    paddingTop: space[8],
    paddingBottom: space[48],
  },
  meta: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    marginBottom: space[8],
  },
  h1: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
    marginTop: space[24],
    marginBottom: space[8],
  },
  h2: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.black,
    color: colors.ink,
    marginTop: space[16],
    letterSpacing: 0.1,
  },
  subhead: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
    marginTop: space[8],
  },
  body: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
    lineHeight: 21,
  },
  bulletList: {
    gap: space[4],
  },
  bulletRow: {
    flexDirection: 'row',
    gap: space[8],
  },
  bulletDot: {
    fontSize: typeTokens.size.bodySM,
    color: colors.dim,
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
    lineHeight: 21,
  },
})
