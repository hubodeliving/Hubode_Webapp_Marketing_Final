import React from 'react';
import PolicyPage, { PolicySection } from '../components/PolicyPage/PolicyPage';

export const metadata = {
  title: 'Refund & Cancellation Policy | Hubode Living',
};

const introCopy = [
  'This Refund & Cancellation Policy outlines the terms applicable to bookings made with Hubode Living, operated by Msphere Holdings Private Limited.',
  'By confirming your booking, you agree to the following conditions:',
];

const sections: PolicySection[] = [
  {
    id: '01',
    title: 'General Terms',
    blocks: [
      {
        type: 'list',
        items: [
          'All bookings are subject to availability and confirmation.',
          'Refunds (full / partial / non-refundable) depend on the timing of cancellation and the type of booking.',
          'Refunds, if approved, will be processed to the original payment method.',
          'Hubode reserves the right to amend this policy at any time.',
        ],
      },
    ],
  },
  {
    id: '02',
    title: 'Refund Eligibility',
    description: 'Refunds are based on the stage at which the cancellation is made:',
    blocks: [
      {
        type: 'list',
        title: '2.1 Before Check-In (Room/Bed Booking)',
        items: [
          'Full Refund: Cancellation made 14 days before the check-in date.',
          'Partial Refund: Cancellation made within 7-14 days before check-in. A deduction of 50% will apply.',
          'Non-Refundable: Cancellation made under 7 days of check-in, or no-show on the check-in date.',
        ],
      },
      {
        type: 'list',
        title: '2.2 Security Deposit Refund',
        items: [
          'The security deposit is refundable, provided all dues are cleared, no damages are found, house rules have been adhered to, and proper notice period is given.',
          'Any deductions (if applicable) will be shared during check-out.',
        ],
      },
    ],
  },
  {
    id: '03',
    title: 'Cancellations After Move-In',
    blocks: [
      {
        type: 'list',
        items: [
          'Early Exit: Refund depends on the remaining lock-in period or your agreed notice period.',
          'If leaving before the notice period, the current month rent will be charged.',
          'If leaving with proper notice, the security deposit will be refunded after deductions.',
          'Prepaid monthly rent for the current month is non-refundable. Future months may be refunded only if specified in the stay agreement.',
        ],
      },
    ],
  },
  {
    id: '04',
    title: 'Date Changes (Rescheduling)',
    blocks: [
      {
        type: 'list',
        items: [
          'Free Rescheduling: If requested 14 days before the original check-in date.',
          'Paid Rescheduling: If requested before 7 days, a rescheduling fee of 10% of applicable rent applies.',
          'Not Allowed: Rescheduling within 7 days of check-in may be considered a cancellation with no refund.',
        ],
      },
    ],
  },
  {
    id: '05',
    title: 'Refund Timelines',
    blocks: [
      {
        type: 'list',
        items: [
          'Once approved, refunds will be processed within 7-14 business days.',
          'Bank delays or gateway delays are outside Hubode’s control.',
          'A confirmation email / message will be sent once processed.',
        ],
      },
    ],
  },
  {
    id: '06',
    title: 'Non-Refundable Situations',
    description: 'Refunds will not be provided in the following cases:',
    blocks: [
      {
        type: 'list',
        items: [
          'No-show on check-in date.',
          'Cancellation within the non-refundable window.',
          'Breach of house rules leading to eviction.',
          'Misconduct or illegal activity.',
          'Damage to property exceeding the deposit.',
          'Early exit without notice.',
          'Service interruptions due to third-party issues (Wi-Fi, power, etc.).',
          'Fees paid for add-ons or upgrades.',
        ],
      },
    ],
  },
  {
    id: '07',
    title: 'Property-Level Policies',
    blocks: [
      {
        type: 'paragraph',
        text: 'Some Hubode properties or room categories may have special cancellation rules, longer lock-in periods, or seasonal / non-refundable promotional rates. In such cases, the respective policy will override this document.',
      },
    ],
  },
  {
    id: '08',
    title: 'How to Request a Cancellation or Refund',
    blocks: [
      {
        type: 'list',
        items: [
          'Email: support@hubodeliving.com',
          'Phone / WhatsApp: +91 8714339611',
          'Website Support Form',
        ],
      },
      {
        type: 'paragraph',
        text: 'Requests must include: Name, Booking ID, Property name, Check-in date, and Reason for cancellation. Hubode will contact you to confirm details and process your request.',
      },
    ],
  },
  {
    id: '09',
    title: 'Changes to This Policy',
    blocks: [
      {
        type: 'paragraph',
        text: 'Hubode may update this Refund & Cancellation Policy at any time. The updated version will be published on the website with a new “Last Updated” date.',
      },
    ],
  },
];

const RefundPolicyPage = () => {
  return <PolicyPage title="Refund & Cancellation Policy" lastUpdated="10/12/2025" intro={introCopy} sections={sections} />;
};

export default RefundPolicyPage;
