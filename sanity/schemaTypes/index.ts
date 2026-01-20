import { type SchemaTypeDefinition } from 'sanity'
import hubodeAmenity from './hubodeAmenity'
import faq from './faq'
import communityItem from './communityItem'
import blogPost from './blogPost'
import career from './career'
import location from './location'
import property from './property'
import contactFormSubmission from './contactFormSubmission'
import referralSubmission from './referralSubmission'
import idleMessage from './idleMessage'
import reportedIssue from './reportedIssue'
import partnershipSubmission from './partnershipSubmission'
import careerApplication from './careerApplication'
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [hubodeAmenity, faq, communityItem, blogPost, career, careerApplication, location, property, contactFormSubmission, partnershipSubmission, referralSubmission, idleMessage, reportedIssue],
}
