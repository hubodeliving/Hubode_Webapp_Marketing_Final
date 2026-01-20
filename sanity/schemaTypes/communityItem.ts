// sanity-studio/schemas/communityItem.ts
import {defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons' // Example icon

// Helper function to get today's date in YYYY-MM-DD format for validation
const today = () => new Date().toISOString().split('T')[0]

export default defineType({
  name: 'communityItem',
  title: 'Community Item / Event',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Name of the community item or event.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eventDate',
      title: 'Date',
      type: 'date',
      description: 'The date associated with this item (e.g., event date, added date). Cannot select future dates.',
      options: {
        dateFormat: 'YYYY-MM-DD', // How it's stored
      },
      validation: (Rule) => [
        Rule.required(),
        // Restrict date selection to today or earlier
        Rule.max(today()).error('Date cannot be in the future.')
      ]
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true, // Enables focal point selection
      },
      fields: [ // Optional: Add alt text field
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility.',
          validation: (Rule) => Rule.required(),
        }
      ],
      validation: (Rule) => Rule.required(), // Make the image required
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'eventDate',
      media: 'image', // Use 'media' for image preview
    },
    prepare(selection) {
      const {title, date, media} = selection
      // Format date for preview subtitle if needed
      const formattedDate = date ? new Date(date).toLocaleDateString() : 'No date set';
      return {
        title: title,
        subtitle: `Date: ${formattedDate}`,
        media: media,
      }
    },
  },
   // Default ordering in the Studio list view (newest first based on date)
  orderings: [
    {
      title: 'Event Date, Newest First',
      name: 'eventDateDesc',
      by: [{field: 'eventDate', direction: 'desc'}]
    },
    {
      title: 'Event Date, Oldest First',
      name: 'eventDateAsc',
      by: [{field: 'eventDate', direction: 'asc'}]
    },
  ]
})