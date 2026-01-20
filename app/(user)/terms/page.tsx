import React from 'react';
import PolicyPage, { PolicySection } from '../components/PolicyPage/PolicyPage';

export const metadata = {
  title: 'Terms & Conditions | Hubode Living',
};

const introCopy = [
  'By accessing our website, booking a room/bed, or residing at Hubode, you agree to the following Terms & Conditions. These terms may be updated periodically.',
];

const sections: PolicySection[] = [
  {
    id: '01',
    title: 'Eligibility',
    blocks: [
      {
        type: 'list',
        items: [
          'Hubode operates both female-only and mixed-gender co-living properties and the eligibility requirement will depend on the specific property selected at the time of booking.',
          'Residents must be 18 years or older, unless approved in writing by management.',
          'Valid government ID such as Aadhar/PAN Card and verification documents must be provided during booking and check-in.',
        ],
      },
    ],
  },
  {
    id: '02',
    title: 'Booking & Payments',
    blocks: [
      {
        type: 'list',
        items: [
          'Booking is confirmed only after payment of the security deposit plus first month’s rent.',
          'All payments are non-refundable, unless stated otherwise.',
          'Security deposit is refundable after adjusting damages, dues, or any penalties applicable.',
          'Late payments may attract a late fee as per Hubode policy.',
          'Prices, offers, and room availability may change without prior notice.',
        ],
      },
    ],
  },
  {
    id: '03',
    title: 'Check-In & Check-Outs',
    blocks: [
      {
        type: 'list',
        items: [
          'Check-in Time: 9:00 a.m. to 6:00 p.m.',
          'Check-out Time: 9:00 a.m. to 6:00 p.m.',
          'Early move-in or late check-out is subject to availability and additional charges.',
          'Minimum Stay Requirement: 3 months, unless agreed otherwise by the management.',
        ],
      },
    ],
  },
  {
    id: '04',
    title: 'House Rules',
    blocks: [
      {
        type: 'list',
        items: [
          'Entry for Men/Women to designated areas are subject to specific property.',
          'Visitors are allowed only during specified hours and must be registered.',
          'Noise levels should be kept minimal, especially during quiet hours (10:00 p.m. to 5:00 a.m.).',
          'Alcohol and illegal substances, are strictly prohibited inside the premises.',
          'All indoor areas are smoke-free. Smoking is permitted only in designated outdoor spaces within the premises.',
          'Residents must maintain cleanliness in rooms and shared spaces.',
          'Misconduct, harassment, violence, or disruption may lead to immediate termination of stay.',
          'Pets are not allowed unless specified.',
          'Any damage to Hubode property caused by the resident must borne by the resident',
        ],
      },
    ],
  },
  {
    id: '05',
    title: 'Facilities & Services',
    blocks: [
      {
        type: 'list',
        items: [
          'Hubode provides various amenities such as housekeeping, Wi-Fi, security, common areas, and terrace spaces.',
          'Availability of services may vary based on maintenance or operational reasons.',
          'Hubode is not responsible for service interruptions caused by third-party providers (Wi-Fi, electricity, etc.).',
          'Use of amenities is at the resident’s own risk, and must follow safety guidelines.',
        ],
      },
    ],
  },
  {
    id: '06',
    title: 'Safety & Security',
    blocks: [
      {
        type: 'list',
        items: [
          'Hubode premises are monitored with CCTV in common areas for resident safety.',
          'Residents must not tamper with safety devices (CCTV, fire extinguishers, etc.).',
          'Hubode is not responsible for loss of personal belongings. Lockers and room locks must be used responsibly.',
        ],
      },
    ],
  },
  {
    id: '07',
    title: 'Cleanliness & Maintenance',
    blocks: [
      {
        type: 'list',
        items: [
          'Regular housekeeping is provided as per schedule.',
          'Residents must allow maintenance staff access for repairs, inspections, and cleaning after prior notice.',
          'Any urgent repair request should be raised to the Hubode team immediately.',
        ],
      },
    ],
  },
  {
    id: '08',
    title: 'Prohibited Activities',
    blocks: [
      {
        type: 'list',
        items: [
          'Subletting rooms or beds.',
          'Running any business, illegal or commercial activity inside the property.',
          'Bringing male/female guests inside restricted zones (Property Specific).',
          'Tampering with electrical systems, locks, or building structure.',
          'Activities that violate local laws or Hubode policies.',
          'Hubode reserves the right to take action, including eviction.',
        ],
      },
    ],
  },
  {
    id: '09',
    title: 'Termination & Eviction',
    blocks: [
      {
        type: 'list',
        items: [
          'House rules are violated',
          'Payment default occurs beyond the grace period',
          'Safety or security of community is compromised',
          'Misconduct or illegal activities are reported',
        ],
      },
      {
        type: 'paragraph',
        text: 'Refund of deposit (if any) will depend on dues and damages. Residents may also terminate their stay by giving 30 days’ notice period. Early exit charges may apply.',
      },
    ],
  },
  {
    id: '10',
    title: 'Liability',
    blocks: [
      {
        type: 'list',
        items: [
          'Hubode is not liable for accidental injuries, natural calamities, power outages, or events beyond control.',
          'Residents must take reasonable precautions and use facilities responsibly.',
          'Residents are responsible for securing their personal belongings. Hubode is not liable for theft, loss, or damage to personal items.',
          'Hubode is not liable for personal disputes between residents or conflicts arising from shared living arrangements.',
        ],
      },
    ],
  },
  {
    id: '11',
    title: 'Website Usage',
    blocks: [
      {
        type: 'list',
        items: [
          'All content on the Hubode website is the property of Msphere Holdings Private Limited.',
          'Users may not copy, modify, or distribute content without permission.',
          'Hubode is not responsible for third-party links or external services.',
          'Users must not misuse the website, attempt unauthorized access, or engage in activities that may harm the website’s functionality or security.',
          'All bookings or inquiries made through the website are subject to verification and availability; submitting a form does not guarantee a reservation.',
        ],
      },
    ],
  },
  {
    id: '12',
    title: 'Privacy & Data Protection',
    blocks: [
      {
        type: 'list',
        items: [
          'Hubode may collect minimal personal information such as Aadhar/PAN Card for identity verification and operational purposes.',
          'Data will not be shared with third parties except when required by law or for operational needs (payment gateways, security systems, etc.).',
          'By using our website or services, you consent to our Privacy Policy.',
        ],
      },
    ],
  },
  {
    id: '13',
    title: 'Changes to Terms',
    blocks: [
      {
        type: 'paragraph',
        text: 'Hubode reserves the right to update these Terms & Conditions at any time. Changes will be posted on the website and effective immediately.',
      },
    ],
  },
  {
    id: '14',
    title: 'Contact Information',
    blocks: [
      {
        type: 'paragraph',
        text: 'For questions or concerns:',
      },
      {
        type: 'list',
        items: [
          'Hubode Living LLP – Msphere Holdings Private Limited',
          'Email: COO@hubodeliving.com',
          'Phone: +91 8714339611',
          'Address: Hubode Roots, Canal Road, Eranhipalam, P.O Civil Station, Calicut, Kerala – 673006, India',
        ],
      },
    ],
  },
];

const TermsPage = () => {
  return <PolicyPage title="Terms & Conditions" lastUpdated="10/12/2025" intro={introCopy} sections={sections} />;
};

export default TermsPage;
