// sanity-studio/schemas/faq.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      // Using 'text' for potentially longer answers than 'string'
      // Use 'blockContent' if you need rich text (bold, links, etc.) in answers
      type: 'text',
      rows: 4, // Adjust visual height in the studio
      validation: (Rule) => Rule.required(),
    }),
    // No explicit 'id' field needed, Sanity provides '_id' automatically
    // Sanity also automatically adds '_createdAt' and '_updatedAt'
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'answer',
    },
  },
  // Default ordering in the Studio list view (optional)
  orderings: [
    {
      title: 'Creation Date, Newest First',
      name: 'creationDateDesc',
      by: [{field: '_createdAt', direction: 'desc'}]
    },
    {
      title: 'Creation Date, Oldest First',
      name: 'creationDateAsc',
      by: [{field: '_createdAt', direction: 'asc'}]
    },
  ]
})