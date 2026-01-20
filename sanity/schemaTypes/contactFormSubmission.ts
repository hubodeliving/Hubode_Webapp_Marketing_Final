// sanity-studio/schemas/contactFormSubmission.ts
import {defineField, defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons' // Using EnvelopeIcon

export default defineType({
  name: 'contactFormSubmission',
  title: 'Contact Form Submission',
  type: 'document',
  icon: EnvelopeIcon,
  // Make the document read-only in the Studio UI after creation
  readOnly: true,
  // Optionally hide the "Create new" button in the Studio if desired
  // __experimental_actions: [/*'create',*/ 'update', 'delete', 'publish'],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      readOnly: true, // Individual fields also read-only
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string', // Keep as string for flexibility
      readOnly: true,
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string', // Use string, as 'email' type might prevent submission if invalid format entered by user
      readOnly: true,
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      readOnly: true,
    }),
    // Sanity automatically adds _createdAt, which is usually sufficient
    // If you needed a separate submittedAt with specific formatting:
    // defineField({
    //   name: 'submittedAt',
    //   title: 'Submitted At',
    //   type: 'datetime',
    //   readOnly: true,
    // }),
  ],
  // Customize preview in the Studio list view
  preview: {
    select: {
      name: 'name',
      email: 'email',
      createdAt: '_createdAt', // Use built-in timestamp
    },
    prepare(selection) {
      const {name, email, createdAt} = selection
      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString()
        : 'No date';
      return {
        title: name || 'No Name Provided',
        subtitle: `${email || 'No Email'} - ${formattedDate}`,
      }
    },
  },
  // Default ordering in the Studio
  orderings: [
    {
      title: 'Submission Date, Newest First',
      name: 'submissionDateDesc',
      by: [{field: '_createdAt', direction: 'desc'}],
    },
     {
      title: 'Submission Date, Oldest First',
      name: 'submissionDateAsc',
      by: [{field: '_createdAt', direction: 'asc'}],
    },
  ],
})