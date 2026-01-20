// sanity/schemas/hubodeAmenity.ts
import {defineField, defineType} from 'sanity'
import { SparklesIcon } from '@sanity/icons' // Optional: Adds an icon in the Studio

export default defineType({
  name: 'hubodeAmenity',
  title: 'Hubode Amenity', // This name appears in the Studio UI
  type: 'document',
  icon: SparklesIcon, // Optional
  fields: [
    defineField({
      name: 'name',
      title: 'Amenity Name', // Label for the name field
      type: 'string',
      description: 'Enter the name of the amenity (e.g., Laundry, Wi-Fi)',
      validation: (Rule) => Rule.required(), // Makes this field required
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first in the offerings list.',
      validation: (Rule) => Rule.integer().min(0),
      initialValue: 0,
    }),
    defineField({
      name: 'icon',
      title: 'Icon', // Label for the image field
      type: 'image',
      description: 'Upload the icon for this amenity',
      options: {
        hotspot: true, // Allows focusing the image crop
      },
      fields: [ // Add alt text directly to the image object
        {
            name: 'alt',
            type: 'string',
            title: 'Alternative Text',
            description: 'Describe the icon (important for accessibility)',
            validation: (Rule) => Rule.required(), // Make alt text required
        }
      ],
      validation: (Rule) => Rule.required(), // Makes the icon image required
    }),
  ],
  preview: {
    select: {
      title: 'name', // Show the name in list previews
      media: 'icon', // Show the icon in list previews
    },
  },
  orderings: [
    {
      name: 'sortOrderAsc',
      title: 'Sort Order',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
}) 
