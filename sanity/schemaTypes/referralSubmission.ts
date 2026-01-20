// sanity/schemas/referralSubmission.ts
import { defineField, defineType } from 'sanity'
import { EnvelopeIcon } from '@sanity/icons' // Or any appropriate icon

export default defineType({
  name: 'referralSubmission',
  title: 'Referral Submission',
  type: 'document',
  icon: EnvelopeIcon, // Optional: Choose an icon
  fields: [
    defineField({
      name: 'submissionDate',
      title: 'Submission Date',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm'
      },
      initialValue: () => new Date().toISOString(), // Automatically set to current date/time
      readOnly: true, // Make it read-only in the Studio
    }),
    defineField({
      name: 'yourName',
      title: 'Your Name (Referrer)',
      type: 'string',
      validation: Rule => Rule.required().error('Referrer name is required.'),
    }),
    defineField({
      name: 'yourEmail',
      title: 'Your Email (Referrer)',
      type: 'string',
      validation: Rule => Rule.required().email().error('A valid referrer email is required.'),
    }),
    defineField({
      name: 'yourPhone',
      title: 'Your Phone (Referrer)',
      type: 'string',
      // Not making this required based on the form
    }),
    defineField({
      name: 'friendName',
      title: "Friend's Name (Referred)",
      type: 'string',
      validation: Rule => Rule.required().error("Friend's name is required."),
    }),
    defineField({
      name: 'friendEmail',
      title: "Friend's Email (Referred)",
      type: 'string',
      validation: Rule => Rule.required().email().error("A valid friend's email is required."),
    }),
     defineField({
      name: 'friendPhone',
      title: "Friend's Phone (Referred)",
      type: 'string',
      validation: Rule => Rule.required().error("Friend's phone number is required."),
    }),
     defineField({
      name: 'friendGender',
      title: "Friend's Gender",
      type: 'string',
       options: {
         list: [ // Match options from your frontend
           { title: 'Female', value: 'Female' },
           { title: 'Male', value: 'Male' },
           { title: 'Other', value: 'Other' }
         ],
         layout: 'radio', // Or 'dropdown'
       },
      validation: Rule => Rule.required().error("Friend's gender is required."),
    }),
     defineField({
      name: 'interestedLocation',
      title: 'Interested Location',
      type: 'string',
       options: {
         list: [ // Match options from your frontend
           { title: 'Hubode Roots, Kozhikode', value: 'Hubode Roots, Kozhikode' },
           // Add other locations here if they exist
         ],
         layout: 'dropdown',
       },
      validation: Rule => Rule.required().error('Interested location is required.'),
    }),
     defineField({
      name: 'termsAgree',
      title: 'Agreed to Terms',
      type: 'boolean',
      initialValue: false,
       validation: Rule => Rule.required().valid([true]).error('Must agree to terms and conditions.'), // Ensure it's true
       readOnly: true, // Usually just needs to be true for submission
    }),
  ],
  preview: {
    select: {
      referrer: 'yourName',
      referred: 'friendName',
      date: 'submissionDate',
    },
    prepare({ referrer, referred, date }) {
       const formattedDate = date ? new Date(date).toLocaleDateString() : 'No date';
      return {
        title: `Referral: ${referred || 'Unknown'} by ${referrer || 'Unknown'}`,
        subtitle: formattedDate,
      }
    },
  },
})