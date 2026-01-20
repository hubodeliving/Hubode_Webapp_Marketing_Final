// sanity-studio/schemas/career.ts
import {defineField, defineType} from 'sanity'
import {CaseIcon} from '@sanity/icons'

export default defineType({
  name: 'career',
  title: 'Career Opening',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers appear first in the list.',
      validation: (Rule) => Rule.integer().min(0),
    }),
    defineField({
      name: 'jobTitle',
      title: 'Job Title',
      type: 'string',
      description: 'The title of the job opening (e.g., "Residential Interior Designer").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The unique URL path for this job opening. Click Generate.',
      options: {
        source: 'jobTitle', // Generate slug from the job title
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required(),
    }),
     defineField({
      name: 'experienceRequired',
      title: 'Experience Required',
      type: 'string', // Using string for flexibility (e.g., "3 Years", "6 Months", "Fresher")
      description: 'Specify the required experience level.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'The location of the job.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'keySkills',
      title: 'Key Skills',
      type: 'text', // Use text for potentially longer, multi-line list of skills
      rows: 4,
      description: 'List the key skills required, separated by commas or on new lines.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'jobDescription',
      title: 'Job Description / Details',
      type: 'array', // Portable Text for the detailed job page
      description: 'The full description and details of the job role.',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Number', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              { name: 'link', type: 'object', title: 'URL', fields: [ { name: 'href', type: 'url', title: 'URL' }, { name: 'blank', type: 'boolean', title: 'Open in new tab?' } ] },
            ]
          }
        },
        { type: 'image', options: { hotspot: true }, fields: [ { name: 'alt', type: 'string', title: 'Alt Text', validation: (Rule) => Rule.required()}, { name: 'caption', type: 'string', title: 'Caption'} ] },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Set to true to make this job opening visible on the website.',
      initialValue: true,
    }),
  ],
  // Orderings for the Studio list view
  orderings: [
    { title: 'Manual Order, Ascending', name: 'manualOrderAsc', by: [{field: 'order', direction: 'asc'}] },
    { title: 'Job Title A-Z', name: 'jobTitleAsc', by: [{field: 'jobTitle', direction: 'asc'}] },
    { title: 'Job Title Z-A', name: 'jobTitleDesc', by: [{field: 'jobTitle', direction: 'desc'}] },
  ],
  preview: {
    select: {
      title: 'jobTitle',
      location: 'location',
      experience: 'experienceRequired',
    },
    prepare(selection) {
      const {title, location, experience} = selection
      return {
        title: title,
        subtitle: `${location} | Exp: ${experience || 'Not specified'}`,
      }
    },
  },
})
