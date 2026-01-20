// sanity/schemaTypes/reportedIssue.ts
import { defineField, defineType } from 'sanity'
import { CommentIcon } from '@sanity/icons'

export default defineType({
  name: 'reportedIssue',
  title: 'Reported Issue',
  type: 'document',
  icon: CommentIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'roomNumber',
      title: 'Room Number',
      type: 'string',
      validation: (Rule) => Rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'issueDescription',
      title: 'Issue Description',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required(),
      readOnly: true,
    }),
    // Reporter info
    defineField({
      name: 'reportedByName',
      title: 'Reported By (Name)',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'reportedByEmail',
      title: 'Reported By (Email)',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'reportedByUserId',
      title: 'Reported By (User ID)',
      type: 'string',
      readOnly: true,
    }),
    // Property details
    defineField({
      name: 'propertyName',
      title: 'Property Name',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'property',
      title: 'Property',
      type: 'reference',
      to: [{ type: 'property' }],
      readOnly: true,
    }),
    defineField({
      name: 'occupancyName',
      title: 'Room Type (Occupancy)',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'roomTier',
      title: 'Room Tier',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'reportedAt',
      title: 'Reported At',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Newest First',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      room: 'roomNumber',
      issue: 'issueDescription',
      propertyName: 'propertyName',
      createdAt: '_createdAt',
    },
    prepare(selection) {
      const { room, issue, propertyName, createdAt } = selection as any
      const date = createdAt ? new Date(createdAt).toLocaleString() : 'Unknown date'
      const title = propertyName ? `${propertyName} • Room ${room || 'N/A'}` : `Room ${room || 'N/A'}`
      const trimmedIssue = (issue || '').toString().slice(0, 80)
      return {
        title,
        subtitle: `${date} — ${trimmedIssue}${trimmedIssue.length === 80 ? '…' : ''}`,
      }
    },
  },
})

