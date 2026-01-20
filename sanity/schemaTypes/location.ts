// sanity-studio/schemas/location.ts

import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons' // Using PinIcon for location

export default defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  icon: PinIcon, // Optional: Adds a nice icon in the Studio UI
  fields: [
    defineField({
      name: 'name',
      title: 'Location Name',
      type: 'string',
      description: 'The name of the city, area, or specific location (e.g., "Kozhikode", "Downtown Bangalore").',
      validation: (Rule) => Rule.required().error('Location name is required.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'A unique identifier for the location, generated from the name. Click "Generate". (Optional, but good practice)',
      options: {
        source: 'name', // Generate slug from the location name
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      // While not strictly needed for just referencing, slugs are generally useful.
      // You could make validation optional if you prefer:
      // validation: (Rule) => Rule.required(),
    }),
    // Add any other relevant fields later if needed (e.g., state, country, coordinates)
    // For now, just the name is the core requirement for referencing.
  ],

  // Optional: Customize how locations appear in lists in the Studio
  preview: {
    select: {
      title: 'name', // Show the location name as the title
    },
    prepare(selection) {
      const {title} = selection
      return {
        title: title,
        // No subtitle needed for this simple schema yet
      }
    },
  },

  // Optional: Define default sorting order in the Studio
  orderings: [
    {
      title: 'Location Name A-Z',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
     {
      title: 'Location Name Z-A',
      name: 'nameDesc',
      by: [{field: 'name', direction: 'desc'}],
    },
  ],
})