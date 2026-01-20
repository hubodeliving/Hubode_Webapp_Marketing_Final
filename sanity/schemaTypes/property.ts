// sanity-studio/schemas/property.ts
import {defineField, defineType} from 'sanity'
import {HomeIcon, CheckmarkIcon, ListIcon} from '@sanity/icons' // Using relevant icons

export default defineType({
  name: 'property',
  title: 'Property',
  type: 'document',
  icon: HomeIcon,
  // Define groups for better organization in the Studio UI
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'topSection', title: 'Top Section'},
    {name: 'gallery', title: 'Image Gallery'},
    {name: 'details', title: 'Details & Amenities'},
    {name: 'rooms', title: 'Room Types'},
    {name: 'location', title: 'Location Info'},
    {name: 'shared', title: 'Shared Spaces'},
    {name: 'pricing', title: 'Pricing & CTA'},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    // --- Basic Info ---
    defineField({
      name: 'propertyName',
      title: 'Property Name',
      type: 'string',
      description: 'The main name of the property (e.g., "Hubode Roots").',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Unique URL path for this property (generate from name).',
      options: {
        source: 'propertyName',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      group: 'settings',
      validation: (Rule) => Rule.required(),
    }),

    // --- Top Section Fields ---
    defineField({
      name: 'topSectionTitle',
      title: 'Top Section Title',
      type: 'string',
      description: 'The main title shown in the hero banner.',
      group: 'topSection',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'topSectionSubtext',
      title: 'Top Section Subtext',
      type: 'text',
      rows: 3,
      description: 'The subtext shown below the title in the hero banner.',
      group: 'topSection',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image (Top Section Background)',
      type: 'image',
      options: {hotspot: true},
      description: 'Background image for the hero banner.',
      group: 'topSection',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alternative Text', validation: (Rule) => Rule.required()})
      ]
    }),

    // --- Image Gallery ---
    defineField({
      name: 'featuredImage',
      title: 'Featured Image (Gallery)',
      type: 'image',
      options: {hotspot: true},
      description: 'The main, larger image shown on the left of the gallery.',
      group: 'gallery',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alternative Text', validation: (Rule) => Rule.required()})
      ]
    }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery Images (Grid & Lightbox)',
      type: 'array',
      description: 'Additional images for the grid (first 4 used) and lightbox.',
      group: 'gallery',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alternative Text', validation: (Rule) => Rule.required()})
          ]
        }
      ],
    }),

    // --- Property Details ---
    defineField({
      name: 'propertyLocationText',
      title: 'Property Location Text',
      type: 'string',
      description: 'The full address string to display below the property name.',
      group: 'details',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bedCount',
      title: 'Number of Beds',
      type: 'string',
      description: 'Value displayed next to the bed icon (e.g., "120").',
      group: 'details',
    }),
    defineField({
      name: 'bedPostText',
      title: 'Bed Post Text',
      type: 'string',
      description: 'Text shown immediately after the bed count (e.g., "Beds ready to move in").',
      group: 'details',
    }),
    defineField({
      name: 'linkedLocation',
      title: 'Linked Location (from Locations schema)',
      type: 'reference',
      to: [{type: 'location'}],
      description: 'Select the predefined location area this property belongs to.',
      group: 'details',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 8,
      group: 'details',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'amenities',
      title: 'Features / Amenities',
      type: 'array',
      description: 'List the amenities available, each with text and an icon.',
      group: 'details',
      of: [
        defineField({
          name: 'amenity',
          title: 'Amenity',
          type: 'object',
          icon: CheckmarkIcon,
          fields: [
            defineField({
                name: 'text',
                title: 'Amenity Text',
                type: 'string',
                validation: Rule => Rule.required()
            }),
            defineField({
                name: 'icon',
                title: 'Amenity Icon',
                type: 'image',
                options: { hotspot: false },
                validation: Rule => Rule.required(),
                 fields: [
                    defineField({ name: 'alt', type: 'string', title: 'Icon Alt Text', validation: (Rule) => Rule.required()})
                 ]
            }),
          ],
          preview: {
            select: {
              title: 'text',
              media: 'icon'
            },
             prepare({ title, media }) {
               return { title: title || 'No text', media: media };
             }
          }
        })
      ]
    }),

    // --- Location Access ---
     defineField({
      name: 'locationAccess',
      title: 'Location Access',
      type: 'array',
      description: 'List nearby places and distances (e.g., "9.6 Km from Hi Lite Mall").',
      group: 'location',
      of: [ {type: 'string'} ]
    }),

    // --- Room Types (Nested Structure with updated Features) ---
    defineField({
      name: 'roomTypes',
      title: 'Room Types / Occupancy Groups',
      type: 'array',
      group: 'rooms',
      description: 'Define the available occupancy types (Single, Twin, etc.) and their tiers.',
      of: [
        defineField({
          name: 'occupancyGroup',
          title: 'Occupancy Group',
          type: 'object',
          fields: [
            defineField({
              name: 'occupancyName',
              title: 'Occupancy Name',
              type: 'string',
              description: 'e.g., "Single", "Twin", "4 Sharing"',
              options: { list: ["Single", "Twin", "4 Sharing"] },
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'tiers',
              title: 'Room Tiers',
              type: 'array',
              description: 'Define the specific tiers within this occupancy group (Standard, Ensuite, etc.).',
              validation: Rule => Rule.min(1),
              of: [
                defineField({
                  name: 'roomTier',
                  title: 'Room Tier',
                  type: 'object',
                  fields: [
                    defineField({name: 'tierName', title: 'Tier Name', type: 'string', description: 'e.g., "Standard", "Ensuite", "Premium"', validation: Rule => Rule.required()}),
                    defineField({
                      name: 'image', title: 'Room Image', type: 'image', options: {hotspot: true}, validation: Rule => Rule.required(),
                      fields: [ defineField({ name: 'alt', type: 'string', title: 'Alternative Text', validation: (Rule) => Rule.required()}) ]
                    }),
                    defineField({
                      name: 'additionalImages',
                      title: 'Additional Images',
                      type: 'array',
                      description: 'Optional gallery shown when viewing this room type.',
                      of: [
                        {
                          type: 'image',
                          options: { hotspot: true },
                          fields: [
                            defineField({ name: 'alt', type: 'string', title: 'Alternative Text', validation: (Rule) => Rule.required() })
                          ]
                        }
                      ]
                    }),
                    // --- MODIFIED Features Field ---
                    defineField({
                      name: 'features',
                      title: 'Features List',
                      type: 'array',        // Changed to array
                      icon: ListIcon,       // Optional icon
                      description: 'List the key features. Each item will be displayed separated by a bullet point.',
                      of: [ { type: 'string' } ], // Array of strings
                      validation: Rule => Rule.required().min(1),
                    }),
                    // --- END MODIFIED Features Field ---

                    defineField({
                      name: 'sqft',
                      title: 'Square Footage (Sq. Ft.)',
                      type: 'number',
                      description: 'Enter the approximate square footage of the room/tier.',
                      // Optional: Add validation if needed
                      // validation: Rule => Rule.positive().integer()
                    }),
                    defineField({
                      name: 'sqftOptions',
                      title: 'Additional Sq. Ft. Options',
                      type: 'array',
                      description: 'Optional additional square footage options with their own monthly pricing. The sqft and price above are the default option.',
                      of: [
                        defineField({
                          name: 'sqftOption',
                          title: 'Sq. Ft. Option',
                          type: 'object',
                          fields: [
                            defineField({
                              name: 'sqft',
                              title: 'Square Footage (Sq. Ft.)',
                              type: 'number',
                              validation: Rule => Rule.required().positive().integer(),
                            }),
                            defineField({
                              name: 'pricePerMonth',
                              title: 'Price per Month',
                              type: 'number',
                              validation: Rule => Rule.required().positive().precision(0),
                            }),
                          ],
                          preview: {
                            select: { sqft: 'sqft', price: 'pricePerMonth' },
                            prepare({ sqft, price }) {
                              return {
                                title: sqft ? `${sqft} Sq. Ft.` : 'Sq. Ft. option',
                                subtitle: price ? `₹${price}/month` : 'Price not set',
                              };
                            },
                          },
                        }),
                      ],
                    }),
                    defineField({
                      name: 'bunkPricing',
                      title: 'Bunk Pricing (Optional)',
                      type: 'object',
                      description: 'Add specific prices for upper/lower bunk variations. Leave blank if not applicable.',
                      fields: [
                        defineField({
                          name: 'upperBunkPrice',
                          title: 'Upper Bunk Price (₹)',
                          type: 'number',
                          validation: Rule => Rule.min(0).precision(0).warning('Use positive numbers only.'),
                        }),
                        defineField({
                          name: 'upperBunkBedsLeft',
                          title: 'Upper Bunk Beds Left',
                          type: 'number',
                          validation: Rule => Rule.min(0).precision(0).warning('Use non-negative numbers only.'),
                        }),
                        defineField({
                          name: 'lowerBunkPrice',
                          title: 'Lower Bunk Price (₹)',
                          type: 'number',
                          validation: Rule => Rule.min(0).precision(0).warning('Use positive numbers only.'),
                        }),
                        defineField({
                          name: 'lowerBunkBedsLeft',
                          title: 'Lower Bunk Beds Left',
                          type: 'number',
                          validation: Rule => Rule.min(0).precision(0).warning('Use non-negative numbers only.'),
                        }),
                      ],
                    }),
                    defineField({
                      name: 'pricePerMonth',
                      title: 'Price per Month',
                      type: 'number',
                      validation: Rule => Rule.positive().custom((value, context) => {
                        const parent = context.parent as { bunkPricing?: { upperBunkPrice?: number | null; lowerBunkPrice?: number | null } } | undefined;
                        const hasBunkPricing = Boolean(parent?.bunkPricing?.upperBunkPrice || parent?.bunkPricing?.lowerBunkPrice);
                        if (hasBunkPricing) return true;
                        if (typeof value === 'number') return true;
                        return 'Price per Month is required when no bunk pricing is set.';
                      }),
                    }),
                    defineField({
                      name: 'bedsLeft',
                      title: 'Beds Left',
                      type: 'number',
                      validation: Rule => Rule.integer().min(0).custom((value, context) => {
                        const parent = context.parent as { bunkPricing?: { upperBunkPrice?: number | null; lowerBunkPrice?: number | null; upperBunkBedsLeft?: number | null; lowerBunkBedsLeft?: number | null } } | undefined;
                        const hasBunkPricing = Boolean(parent?.bunkPricing?.upperBunkPrice || parent?.bunkPricing?.lowerBunkPrice);
                        const hasBunkBedsLeft = Boolean(parent?.bunkPricing?.upperBunkBedsLeft || parent?.bunkPricing?.lowerBunkBedsLeft);
                        if (hasBunkPricing || hasBunkBedsLeft) return true;
                        if (typeof value === 'number') return true;
                        return 'Beds Left is required when no bunk options are set.';
                      }),
                    }),
                  ],
                   preview: {
                    select: { title: 'tierName', price: 'pricePerMonth', image: 'image' },
                    prepare({ title, price, image }) {
                      return { title: title, subtitle: `₹${price}/month`, media: image };
                    }
                  }
                })
              ]
            })
          ],
          preview: {
            select: { title: 'occupancyName', tierCount: 'tiers' },
            prepare({ title, tierCount }) {
              return { title: title, subtitle: `${tierCount?.length || 0} Tier(s)` };
            }
          }
        })
      ]
    }),

    // --- Location Map ---
    defineField({
      name: 'locationMapLink',
      title: 'Google Maps Embed URL',
      type: 'url',
      description: 'Paste the full embed URL from Google Maps (starts with <iframe src="..."). We only need the URL inside src="...".',
      group: 'location',
      validation: Rule => Rule.uri({scheme: ['http', 'https']})
    }),

    // --- Shared Spaces ---
     defineField({
      name: 'sharedSpacesDescription',
      title: 'Shared Spaces Introduction Text',
      type: 'text',
      rows: 3,
      group: 'shared',
    }),
     defineField({
      name: 'sharedSpaces',
      title: 'Shared Spaces Items',
      type: 'array',
      description: 'Add shared spaces with an image and title.',
      group: 'shared',
      of: [
        defineField({
          name: 'space', title: 'Shared Space', type: 'object',
          fields: [
            defineField({name: 'title', title: 'Space Title', type: 'string', validation: Rule => Rule.required()}),
            defineField({
              name: 'image', title: 'Space Image', type: 'image', options: {hotspot: true}, validation: Rule => Rule.required(),
              fields: [ defineField({ name: 'alt', type: 'string', title: 'Alternative Text', validation: (Rule) => Rule.required()}) ]
            })
          ],
          preview: {
             select: { title: 'title', media: 'image'},
             prepare({ title, media }) { return { title: title, media: media }}
          }
        })
      ]
    }),

    // --- Pricing & CTA (Sticky Right Section) ---
     defineField({
      name: 'priceFrom',
      title: 'Starting Price Text ("From" Price)',
      type: 'string',
      description: 'The starting price displayed in the sticky box (e.g., "4,500").',
      group: 'pricing',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'priceDescription',
      title: 'Price Description (Sticky Box)',
      type: 'string',
      description: 'The text below the starting price in the sticky box.',
      group: 'pricing',
      validation: Rule => Rule.required(),
    }),

     // --- Settings ---
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Set to true to make this property visible on the website.',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'markAsComingSoon',
      title: 'Mark as Coming Soon',
      type: 'boolean',
      description: 'If checked, this property will appear as Coming Soon and will not be clickable.',
      group: 'settings',
      initialValue: false,
    }),

  ],
  // --- Document Level Preview ---
  preview: {
    select: {
      title: 'propertyName',
      location: 'linkedLocation.name', // Fetch name from referenced location
      media: 'featuredImage',
    },
    prepare(selection) {
      const {title, location, media} = selection
      return {
        title: title,
        subtitle: location ? `Location: ${location}` : 'No location linked',
        media: media,
      }
    },
  },
})  
