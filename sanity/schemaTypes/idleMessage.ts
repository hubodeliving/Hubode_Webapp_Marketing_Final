// schemas/idleMessage.ts
import {defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons' // Optional: for a nicer icon in the studio

export default defineType({
  name: 'idleMessage',
  title: 'Idle FAB Message',
  type: 'document',
  icon: CommentIcon, // Updated icon name
  fields: [
    defineField({
      name: 'message',
      title: 'Message Text',
      type: 'string',
      description: 'The text to display in the idle FAB bubble.',
      validation: (Rule) => Rule.required().max(100), // Keep messages relatively short
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'A number to determine the sequence of messages (e.g., 1, 2, 3...). Lower numbers appear first.',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
  ],
  preview: {
    select: {
      title: 'message',
      subtitle: 'order',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'No message text',
        subtitle: subtitle ? `Order: ${subtitle}` : 'No order set',
      }
    },
  },
  orderings: [ // Optional: Define default ordering in the Studio
    {
      title: 'Manual Order, Ascending',
      name: 'manualOrderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
})