import React, { useState } from 'react';

function Contact() {
  const [formState, setFormState] = useState({
    inquiry_type: 'subscriber',
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [status, setStatus] = useState(null);

  function handleChange(e) {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('https://formspree.io/f/xbdgeokl', {
        method: 'POST',
        body: JSON.stringify(formState),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });

      if (response.ok) {
        setStatus('success');
        setFormState({ inquiry_type: 'subscriber', name: '', email: '', company: '', message: '' });
        setTimeout(() => setStatus(null), 5000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus(null), 5000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus(null), 5000);
    }
  }

  return (
    <div className="page">
      <div className="page-hero">
        <div className="container">
          <h1>Get in Touch</h1>
          <p className="page-subtitle">Whether you want to publish strategies, subscribe to them, or just learn more — we'd love to hear from you.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contact-form-wrapper">
            {status === 'success' && (
              <div className="notification success">Thank you for reaching out! We'll get back to you soon.</div>
            )}
            {status === 'error' && (
              <div className="notification error">Something went wrong. Please try again.</div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="inquiry_type">I'm interested in...</label>
                <select id="inquiry_type" name="inquiry_type" value={formState.inquiry_type} onChange={handleChange} required>
                  <option value="subscriber">Subscribing to strategies</option>
                  <option value="creator">Publishing strategies as a creator</option>
                  <option value="partnership">Partnership opportunities</option>
                  <option value="general">General inquiry</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" type="text" placeholder="Your Name" value={formState.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="Your Email" value={formState.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="company">Company (optional)</label>
                <input id="company" name="company" type="text" placeholder="Your Company or Fund" value={formState.company} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your trading background, what markets you're interested in, or any questions you have."
                  value={formState.message}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
