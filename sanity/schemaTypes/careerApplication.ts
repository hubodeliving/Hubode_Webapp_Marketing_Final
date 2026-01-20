// sanity/schemaTypes/careerApplication.ts
import {defineField, defineType} from 'sanity'
import {ClipboardIcon} from '@sanity/icons'

export default defineType({
  name: 'careerApplication',
  title: 'Career Applications',
  type: 'document',
  icon: ClipboardIcon,
  fields: [
    defineField({
      name: 'submissionDate',
      title: 'Submission Date',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
      },
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'jobTitle',
      title: 'Job Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'jobSlug',
      title: 'Job Slug',
      type: 'string',
    }),
    defineField({
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cv',
      title: 'CV',
      type: 'file',
      options: {
        accept: '.pdf,.doc,.docx',
      },
    }),
  ],
  preview: {
    select: {
      title: 'jobTitle',
      firstName: 'firstName',
      lastName: 'lastName',
      date: 'submissionDate',
    },
    prepare({title, firstName, lastName, date}) {
      const formattedDate = date ? new Date(date).toLocaleDateString() : 'No date'
      return {
        title: `${title || 'Career Application'} - ${firstName || ''} ${lastName || ''}`.trim(),
        subtitle: formattedDate,
      }
    },
  },
})
