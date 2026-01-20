import React from 'react';
import PolicyPage, { PolicySection } from '../components/PolicyPage/PolicyPage';

export const metadata = {
  title: 'Privacy Policy | Hubode Living',
};

const introCopy = [
  'Hubode Living (“Hubode”, “we”, “our”, “us”), operated by Msphere Holdings Private Limited, is committed to protecting your personal information. This Privacy Policy explains how we collect, store, use, and share data when you visit our website, make a booking, or stay at any Hubode property.',
  'By accessing our website or using our services, you agree to the terms outlined in this Privacy Policy.',
];

const sections: PolicySection[] = [
  {
    id: '01',
    title: 'Information We Collect',
    description: 'We may collect the following categories of information:',
    blocks: [
      {
        type: 'list',
        title: '1.1 Personal Information (provided directly by you)',
        items: [
          'Full name',
          'Age and date of birth',
          'Gender',
          'Email address',
          'Phone number',
          'Residential address',
          'Government ID documents (Aadhaar, Passport, PAN, etc.)',
          'Emergency contact details',
          'Payment information (handled by payment gateway, not stored by Hubode)',
          'Booking and stay details',
        ],
      },
      {
        type: 'list',
        title: '1.2 Automatically Collected Information (from website/app)',
        items: [
          'Device information',
          'IP address',
          'Browser type and version',
          'Pages viewed, time spent, clicks',
          'Cookies and similar tracking technologies',
        ],
      },
      {
        type: 'list',
        title: '1.3 CCTV & On-Property Data',
        items: [
          'CCTV footage in common areas',
          'Visitor logbook entries',
          'Access log data from smart locks and entry systems',
        ],
      },
      {
        type: 'list',
        title: '1.4 Third-Party Data (if you interact with partners)',
        items: [
          'Payment confirmation from payment gateway',
          'Information from customer support platforms',
          'Data from marketing or analytics tools',
        ],
      },
    ],
  },
  {
    id: '02',
    title: 'How We Use Your Information',
    description: 'We use collected data strictly for legitimate business and safety purposes:',
    blocks: [
      {
        type: 'list',
        title: '2.1 To Provide Services',
        items: [
          'Process bookings and reservations',
          'Verify identity and eligibility',
          'Manage your stay at Hubode',
          'Provide support and communication',
          'Handle billing, invoicing, and refunds',
        ],
      },
      {
        type: 'list',
        title: '2.2 Safety & Security',
        items: [
          'Access control in female-only properties',
          'Monitoring via CCTV in common areas',
          'Emergency and incident management',
        ],
      },
      {
        type: 'list',
        title: '2.3 Website Improvements',
        items: [
          'Improve user experience',
          'Fix technical issues',
          'Analyse website performance',
        ],
      },
      {
        type: 'list',
        title: '2.4 Marketing & Communication',
        items: [
          'Send updates, offers, and announcements (only with your consent)',
          'Conduct surveys and feedback collection',
        ],
      },
      {
        type: 'paragraph',
        text: 'You may opt out anytime.',
      },
    ],
  },
  {
    id: '03',
    title: 'How We Store & Protect Data',
    description: 'We follow reasonable technical and organizational measures to safeguard your personal information.',
    blocks: [
      {
        type: 'list',
        title: '3.1 Storage',
        items: [
          'Data is stored securely on encrypted servers or systems',
          'Access is restricted to authorized personnel only',
          'Payment details are not stored by Hubode; they are processed by secure third-party gateways',
        ],
      },
      {
        type: 'list',
        title: '3.2 Retention',
        items: [
          'Legal compliance',
          'Security and audit requirements',
          'Completing the service (booking, stay)',
        ],
      },
      {
        type: 'paragraph',
        text: 'CCTV footage may be retained for 60-90 days unless required for investigation.',
      },
    ],
  },
  {
    id: '04',
    title: 'Sharing of Information',
    description: 'We do not sell or trade your personal information. We share data only in the following situations:',
    blocks: [
      {
        type: 'list',
        title: '4.1 Service Providers',
        items: [
          'Payment gateways',
          'Security & CCTV vendors',
          'Housekeeping or facility management partners',
          'IT, cloud hosting, and analytics providers',
          'Customer support platforms (WhatsApp API, email service tools, etc.)',
        ],
      },
      {
        type: 'list',
        title: '4.2 Legal Requirements',
        items: [
          'Police or government authorities',
          'Court orders',
          'Legal or regulatory compliance needs',
        ],
      },
      {
        type: 'list',
        title: '4.3 Internal Purposes',
        items: ['Shared within Msphere Holdings Private Limited for operational and safety requirements'],
      },
    ],
  },
  {
    id: '05',
    title: 'Cookies & Tracking Technologies',
    blocks: [
      {
        type: 'paragraph',
        text: 'Our website may use cookies, web beacons, and analytics scripts (Google Analytics, Meta Pixel, etc.).',
      },
      {
        type: 'list',
        title: 'Cookies help us:',
        items: [
          'Understand website traffic',
          'Improve performance',
          'Personalize user experience',
        ],
      },
      {
        type: 'paragraph',
        text: 'You can disable cookies in your browser settings.',
      },
    ],
  },
  {
    id: '06',
    title: 'Your Rights',
    description: 'Depending on applicable laws, you may have the right to:',
    blocks: [
      {
        type: 'list',
        items: [
          'Access your data',
          'Correct inaccurate information',
          'Request deletion (where legally allowed)',
          'Withdraw marketing consent',
          'Request a copy of your stored data',
        ],
      },
      {
        type: 'paragraph',
        text: 'To exercise any rights, contact us at support@hubodeliving.com.',
      },
    ],
  },
  {
    id: '07',
    title: 'Third-Party Links',
    blocks: [
      {
        type: 'paragraph',
        text: 'Our website may contain links to external websites. Hubode is not responsible for the privacy practices of third-party sites.',
      },
    ],
  },
  {
    id: '08',
    title: 'Data of Minors',
    blocks: [
      {
        type: 'paragraph',
        text: 'Hubode does not knowingly collect data from minors (under 18), except when explicitly allowed by parents/guardians and approved by management.',
      },
    ],
  },
  {
    id: '09',
    title: 'Policy Changes',
    blocks: [
      {
        type: 'paragraph',
        text: 'We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised “Last Updated” date.',
      },
    ],
  },
  {
    id: '10',
    title: 'Contact Us',
    blocks: [
      {
        type: 'paragraph',
        text: 'For questions or concerns, please reach out to:',
      },
      {
        type: 'list',
        items: [
          'Hubode Living LLP – Msphere Holdings Private Limited',
          'Email: support@hubodeliving.com',
          'Phone: +91 8714339611',
          'Address: Hubode Roots, Canal Road, Eranhipalam, P.O Civil Station, Calicut, Kerala – 673006, India',
        ],
      },
    ],
  },
];

const PrivacyPolicyPage = () => {
  return <PolicyPage title="Privacy Policy" lastUpdated="10/12/2025" intro={introCopy} sections={sections} />;
};

export default PrivacyPolicyPage;
