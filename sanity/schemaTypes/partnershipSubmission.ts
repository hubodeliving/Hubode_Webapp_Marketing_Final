import {UsersIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'partnershipSubmission',
  title: 'Partnership Submission',
  type: 'document',
  icon: UsersIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'partnerType',
      title: 'Who are you',
      type: 'string',
      options: {
        list: [
          'Property owners',
          'Developers',
          'Landowners',
          'Investors',
          'Corporates & Institutions',
          'Brand Collaborations',
        ],
      },
      readOnly: true,
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'partnerType',
      createdAt: '_createdAt',
    },
    prepare({title, subtitle, createdAt}) {
      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleString()
        : 'No date'
      return {
        title: title || 'No Name Provided',
        subtitle: `${subtitle || 'No type'} • ${formattedDate}`,
      }
    },
  },
  orderings: [
    {
      title: 'Newest first',
      name: 'createdDesc',
      by: [{field: '_createdAt', direction: 'desc'}],
    },
    {
      title: 'Oldest first',
      name: 'createdAsc',
      by: [{field: '_createdAt', direction: 'asc'}],
    },
  ],
})
