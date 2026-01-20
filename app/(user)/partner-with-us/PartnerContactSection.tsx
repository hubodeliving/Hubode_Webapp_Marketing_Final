'use client'

import React, {useState} from 'react'

const partnerTypeOptions = [
  'Property owner',
  'Developer',
  'Landowner',
  'Investor',
  'Corporates & Institutions',
  'Brand Collaborations',
]

const initialFormState = {
  name: '',
  phone: '',
  email: '',
  partnerType: '',
  message: '',
}

const PartnerContactSection = () => {
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const {name, value} = event.target
    setFormData(prev => ({...prev, [name]: value}))
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const {name, phone, email, partnerType, message} = formData
    if (!name || !phone || !email || !partnerType || !message) {
      setError('Please fill out every field.')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/partner-submissions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Unable to submit form.')
      }

      setFormData(initialFormState)
      setSuccess(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="contact-section-container flex items-center justify-center margin-bottom">
      <div className="contact-section container">
        <div className="contact-left">
          <h5>Build a Business</h5>
          <h2>That Brings Back</h2>
          <p>
            Turn underperforming assets into a reliable income engine without losing clarity or
            control. Reach out to us or fill the interest form, and our team will connect with you
            shortly.
          </p>
          <a href="mailto:ceo@hubodeliving.com" className="email-pill">
            <img src="/images/email-contact.svg" alt="Email icon" />
            <span>Email us : ceo@hubodeliving.com</span>
          </a>
        </div>

        <div className="contact-right">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row form-row-split">
              <div className="form-group">
                <label htmlFor="partner-name">Name</label>
                <input
                  type="text"
                  id="partner-name"
                  name="name"
                  placeholder="Enter your First Name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="partner-phone">Phone</label>
                <input
                  type="tel"
                  id="partner-phone"
                  name="phone"
                  placeholder="Enter your Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-row form-row-split">
              <div className="form-group">
                <label htmlFor="partner-email">Email</label>
                <input
                  type="email"
                  id="partner-email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="partner-type">Who you are</label>
                <select
                  id="partner-type"
                  name="partnerType"
                  value={formData.partnerType}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                >
                  <option value="" disabled>
                    Choose who are you
                  </option>
                  {partnerTypeOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="partner-message">Message</label>
                <textarea
                  id="partner-message"
                  name="message"
                  placeholder="Enter your Message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                ></textarea>
              </div>
            </div>

            <div className="form-row form-row-submit">
              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>

            {(error || success) && (
              <div className="form-row" style={{marginTop: '0.5rem'}}>
                {error && ( 
                  <p className="form-feedback error" role="alert" style={{color: 'red'}}>
                    {error}
                  </p>
                )}
                {success && !error && (
                  <p className="form-feedback success" role="status" style={{color: 'green'}}>
                    Message sent successfully!
                  </p>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}

export default PartnerContactSection