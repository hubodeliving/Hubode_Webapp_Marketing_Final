'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'
import hubodeAmenity from './sanity/schemaTypes/hubodeAmenity'
import faq from './sanity/schemaTypes/faq'
import communityItem from './sanity/schemaTypes/communityItem'  
import blogPost from './sanity/schemaTypes/blogPost'
import career from './sanity/schemaTypes/career'
import location from './sanity/schemaTypes/location'
import property from './sanity/schemaTypes/property'
import contactFormSubmission from './sanity/schemaTypes/contactFormSubmission'
import referralSubmission from './sanity/schemaTypes/referralSubmission'
import idleMessage from './sanity/schemaTypes/idleMessage'
import partnershipSubmission from './sanity/schemaTypes/partnershipSubmission'
import careerApplication from './sanity/schemaTypes/careerApplication'
export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],

  schemaTypes: [
    hubodeAmenity,
    faq,
    communityItem,
    blogPost,
    career,
    careerApplication,
    location,
    property,
    contactFormSubmission,
    partnershipSubmission,
    referralSubmission,
    idleMessage
  ]
})
