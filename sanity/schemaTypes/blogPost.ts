// sanity-studio/schemas/blogPost.ts
import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons' // Or another suitable icon

// Helper function to get today's date in YYYY-MM-DD format for validation
const today = () => new Date().toISOString().split('T')[0]

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The main title of the blog post.',
      validation: (Rule) => Rule.required().max(90).warning('Shorter titles are usually better for SEO.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The unique URL path for this post. Click Generate.',
      options: {
        source: 'title', // Generate slug from the title field
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context), // Ensure slug is unique across documents
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date', // Use 'date' if time is not important, 'datetime' otherwise
      description: 'The date the post was published. Used for ordering.',
      options: {
        dateFormat: 'YYYY-MM-DD',
      },
      initialValue: today(), // Default to today's date
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      description: 'The primary image for the blog post (e.g., for cards and the top of the post).',
      options: {
        hotspot: true, // Enables focal point selection
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text (Alt Text)',
          description: 'Crucial for SEO and accessibility. Describe the image.',
          validation: (Rule) => Rule.required(),
        }
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
        name: 'excerpt',
        title: 'Excerpt / Subtext',
        type: 'text', // Use 'text' for multi-line plain text
        rows: 4, // Set preferred rows in the Studio UI
        description: 'A short summary of the post, used in listings. Keep it concise (around 1-2 sentences).',
        validation: (Rule) => Rule.required().max(300), // Max characters validation
      }),
    defineField({
      name: 'body',
      title: 'Body Content',
      type: 'array', // Use 'array' for Portable Text / Rich Text
      description: 'The main content of the blog post.',
      of: [
        {
          type: 'block', // Standard text blocks
          styles: [ // Define allowed text styles
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'}
          ],
          lists: [ // Define allowed list types
            {title: 'Bullet', value: 'bullet'},
            {title: 'Number', value: 'number'}
          ],
          marks: { // Define allowed text decorato and annotations (links)
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Underline', value: 'underline'}
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'URL',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' },
                  { name: 'blank', type: 'boolean', title: 'Open in new tab?' }
                ]
              },
            ]
          }
        },
        {
          type: 'image', // Allow inserting images within the body
          options: { hotspot: true },
          fields: [
             {
               name: 'alt',
               type: 'string',
               title: 'Alternative Text',
               validation: (Rule) => Rule.required(),
             },
             {
               name: 'caption',
               type: 'string',
               title: 'Caption',
             }
          ]
        },
        // Add other custom block types here if needed (e.g., code blocks, videos)
        // { type: 'code' },
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  // Default ordering in the Studio list view
  orderings: [
    {
      title: 'Published Date, Newest First',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}]
    },
    {
      title: 'Published Date, Oldest First',
      name: 'publishedAtAsc',
      by: [{field: 'publishedAt', direction: 'asc'}]
    },
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishedAt',
      media: 'mainImage',
      slug: 'slug.current',
    },
    prepare(selection) {
      const {title, date, media, slug} = selection
      const formattedDate = date ? new Date(date).toLocaleDateString() : 'No date';
      return {
        title: title,
        subtitle: `Published: ${formattedDate} | Slug: /blog/${slug || 'missing'}`,
        media: media,
      }
    },
  },
})
