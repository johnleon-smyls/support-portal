// Centralized demo/dummy data for presentation mode.
// Toggle via NEXT_PUBLIC_DEMO_MODE=true in .env.local

import { HDTicket, HDCommunication, HDArticle } from '@/types/frappe';

export const DEMO_USER = {
  name: 'sarah.chen@brightsmile.ca',
  email: 'sarah.chen@brightsmile.ca',
  full_name: 'Dr. Sarah Chen',
  first_name: 'Sarah',
  last_name: 'Chen',
  roles: ['Website User'],
  enabled: 1,
  user_type: 'Website User' as const,
};

// Any email/password combo works in demo mode
export const DEMO_PASSWORD = 'demo';

export const DEMO_TICKETS: HDTicket[] = [
  {
    name: 'TKT-2026-001',
    subject: 'Patient chart not syncing after appointment',
    description:
      '<p>After completing an appointment, the patient chart does not sync to our local backup system. This started happening after the latest update on March 3rd.</p>' +
      '<p><strong>Steps to reproduce:</strong></p><ol>' +
      '<li>Complete a patient appointment in the system</li>' +
      '<li>Navigate to the patient chart</li>' +
      '<li>Check sync status — shows "Pending" indefinitely</li></ol>' +
      '<p>This is affecting multiple operatories. We need this resolved before Monday.</p>',
    status: 'Open',
    priority: 'High',
    raised_by: 'sarah.chen@brightsmile.ca',
    creation: '2026-03-05T09:15:00.000Z',
    modified: '2026-03-06T14:22:00.000Z',
    owner: 'sarah.chen@brightsmile.ca',
    ticket_type: 'Technical Support',
  },
  {
    name: 'TKT-2026-002',
    subject: 'Request: Add multi-provider scheduling view',
    description:
      '<p>We would love a consolidated calendar view that shows all providers\' schedules side by side. Currently we have to switch between individual provider views which is time-consuming for our front desk team.</p>' +
      '<p>Ideally it would support:</p><ul>' +
      '<li>Color-coded appointments per provider</li>' +
      '<li>Drag-and-drop rescheduling</li>' +
      '<li>Filtering by appointment type</li></ul>',
    status: 'Open',
    priority: 'Medium',
    raised_by: 'sarah.chen@brightsmile.ca',
    creation: '2026-02-28T11:30:00.000Z',
    modified: '2026-03-04T16:45:00.000Z',
    owner: 'sarah.chen@brightsmile.ca',
    ticket_type: 'Feature Request',
  },
  {
    name: 'TKT-2026-003',
    subject: 'Billing export CSV missing column headers',
    description:
      '<p>When exporting the monthly billing report as CSV, the column headers are missing from the file. The data rows are all there, but without headers it\'s difficult to import into our accounting software.</p>' +
      '<p>Browser: Chrome 124<br/>Export date range: February 2026</p>',
    status: 'Closed',
    priority: 'Medium',
    raised_by: 'sarah.chen@brightsmile.ca',
    creation: '2026-02-20T08:00:00.000Z',
    modified: '2026-02-22T10:30:00.000Z',
    owner: 'sarah.chen@brightsmile.ca',
    ticket_type: 'Bug Report',
    resolution: '<p>Fixed in v2.4.1 — CSV exports now include proper column headers. Please clear your browser cache and try again.</p>',
    resolution_date: '2026-02-22T10:30:00.000Z',
  },
  {
    name: 'TKT-2026-004',
    subject: 'How to set up automated appointment reminders?',
    description:
      '<p>We want to enable automated SMS and email reminders for patients 24 hours before their appointments. Could you walk us through the setup process?</p>' +
      '<p>We have about 200 appointments per week across 3 providers.</p>',
    status: 'Closed',
    priority: 'Low',
    raised_by: 'sarah.chen@brightsmile.ca',
    creation: '2026-02-10T14:20:00.000Z',
    modified: '2026-02-12T09:15:00.000Z',
    owner: 'sarah.chen@brightsmile.ca',
    ticket_type: 'General Inquiry',
  },
  {
    name: 'TKT-2026-005',
    subject: 'Unable to upload X-ray images larger than 10MB',
    description:
      '<p>Our new digital X-ray machine produces images around 12-15MB each. The system rejects these with a "File too large" error. Previously our images were under 10MB so this wasn\'t an issue.</p>' +
      '<p>Can the upload limit be increased to at least 20MB?</p>',
    status: 'Open',
    priority: 'High',
    raised_by: 'sarah.chen@brightsmile.ca',
    creation: '2026-03-06T10:45:00.000Z',
    modified: '2026-03-06T10:45:00.000Z',
    owner: 'sarah.chen@brightsmile.ca',
    ticket_type: 'Technical Support',
  },
  {
    name: 'TKT-2026-006',
    subject: 'Insurance verification taking too long',
    description:
      '<p>The insurance verification check is taking 30+ seconds per patient, when it used to complete in under 5 seconds. This is causing significant delays at check-in.</p>' +
      '<p>This started approximately March 1st. All insurance providers seem affected.</p>',
    status: 'Open',
    priority: 'Urgent',
    raised_by: 'sarah.chen@brightsmile.ca',
    creation: '2026-03-03T07:50:00.000Z',
    modified: '2026-03-05T11:30:00.000Z',
    owner: 'sarah.chen@brightsmile.ca',
    ticket_type: 'Bug Report',
  },
];

export const DEMO_REPLIES: Record<string, HDCommunication[]> = {
  'TKT-2026-001': [
    {
      name: 'REPLY-001',
      content: '<p>Hi Dr. Chen, thank you for reporting this. We\'re looking into the sync issue now. Could you let us know which operatories are affected and if this happens for all appointment types?</p>',
      sender: 'support@smyls.ca',
      sender_full_name: 'SMYLS Support',
      communication_type: 'Communication' as const,
      sent_or_received: 'Sent' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-001',
      creation: '2026-03-05T10:30:00.000Z',
      modified: '2026-03-05T10:30:00.000Z',
      owner: 'support@smyls.ca',
    },
    {
      name: 'REPLY-002',
      content: '<p>It\'s happening in Operatories 1, 2, and 4. Operatory 3 seems fine. It affects all appointment types — cleanings, fillings, and consultations.</p>',
      sender: 'sarah.chen@brightsmile.ca',
      sender_full_name: 'Dr. Sarah Chen',
      communication_type: 'Communication' as const,
      sent_or_received: 'Received' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-001',
      creation: '2026-03-05T11:15:00.000Z',
      modified: '2026-03-05T11:15:00.000Z',
      owner: 'sarah.chen@brightsmile.ca',
    },
    {
      name: 'REPLY-003',
      content: '<p>Thanks for the details. We\'ve identified the issue — it\'s related to a configuration change in the sync module. We\'re preparing a fix and will deploy it today. I\'ll update you once it\'s live.</p>',
      sender: 'support@smyls.ca',
      sender_full_name: 'SMYLS Support',
      communication_type: 'Communication' as const,
      sent_or_received: 'Sent' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-001',
      creation: '2026-03-06T14:22:00.000Z',
      modified: '2026-03-06T14:22:00.000Z',
      owner: 'support@smyls.ca',
    },
  ],
  'TKT-2026-002': [
    {
      name: 'REPLY-004',
      content: '<p>Hi Dr. Chen! Great suggestion — a multi-provider view is actually on our Q2 roadmap. I\'ve added your specific requirements (color-coding, drag-and-drop, filtering) to the feature spec. We\'ll keep you posted on progress!</p>',
      sender: 'product@smyls.ca',
      sender_full_name: 'SMYLS Product Team',
      communication_type: 'Communication' as const,
      sent_or_received: 'Sent' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-002',
      creation: '2026-03-01T09:00:00.000Z',
      modified: '2026-03-01T09:00:00.000Z',
      owner: 'product@smyls.ca',
    },
    {
      name: 'REPLY-005',
      content: '<p>That\'s wonderful to hear! Our front desk staff will be thrilled. Would it be possible to get early access to a beta version when it\'s ready?</p>',
      sender: 'sarah.chen@brightsmile.ca',
      sender_full_name: 'Dr. Sarah Chen',
      communication_type: 'Communication' as const,
      sent_or_received: 'Received' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-002',
      creation: '2026-03-02T10:00:00.000Z',
      modified: '2026-03-02T10:00:00.000Z',
      owner: 'sarah.chen@brightsmile.ca',
    },
    {
      name: 'REPLY-006',
      content: '<p>Absolutely! I\'ve added Bright Smile Dental to our beta tester list. You\'ll be among the first to try it out. Expected beta: late April 2026.</p>',
      sender: 'product@smyls.ca',
      sender_full_name: 'SMYLS Product Team',
      communication_type: 'Communication' as const,
      sent_or_received: 'Sent' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-002',
      creation: '2026-03-04T16:45:00.000Z',
      modified: '2026-03-04T16:45:00.000Z',
      owner: 'product@smyls.ca',
    },
  ],
  'TKT-2026-006': [
    {
      name: 'REPLY-007',
      content: '<p>Dr. Chen, we\'re aware of the slowdown affecting insurance verifications. Our infrastructure team identified a bottleneck in the verification API gateway. We\'ve scaled up the service and are monitoring performance. You should see improvements within the next hour.</p>',
      sender: 'support@smyls.ca',
      sender_full_name: 'SMYLS Support',
      communication_type: 'Communication' as const,
      sent_or_received: 'Sent' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-006',
      creation: '2026-03-03T09:15:00.000Z',
      modified: '2026-03-03T09:15:00.000Z',
      owner: 'support@smyls.ca',
    },
    {
      name: 'REPLY-008',
      content: '<p>It\'s a bit faster now (about 15 seconds) but still not back to normal. Is there anything else being done?</p>',
      sender: 'sarah.chen@brightsmile.ca',
      sender_full_name: 'Dr. Sarah Chen',
      communication_type: 'Communication' as const,
      sent_or_received: 'Received' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-006',
      creation: '2026-03-03T14:00:00.000Z',
      modified: '2026-03-03T14:00:00.000Z',
      owner: 'sarah.chen@brightsmile.ca',
    },
    {
      name: 'REPLY-009',
      content: '<p>Yes, we\'re deploying an optimized caching layer that should bring response times back under 5 seconds. This will go live tonight during our maintenance window (11 PM - 1 AM ET). We\'ll confirm once it\'s complete.</p>',
      sender: 'support@smyls.ca',
      sender_full_name: 'SMYLS Support',
      communication_type: 'Communication' as const,
      sent_or_received: 'Sent' as const,
      reference_doctype: 'HD Ticket',
      reference_name: 'TKT-2026-006',
      creation: '2026-03-05T11:30:00.000Z',
      modified: '2026-03-05T11:30:00.000Z',
      owner: 'support@smyls.ca',
    },
  ],
};

export const DEMO_ARTICLES: HDArticle[] = [
  {
    name: 'KB-001',
    title: 'Getting Started with SMYLS Support Portal',
    content: `<h1>Getting Started with SMYLS Support Portal</h1>
<p>Welcome to the SMYLS Support Portal! This guide will help you navigate the system and get the most out of our support resources.</p>

<h2>Logging In</h2>
<p>Use the email and password provided by your clinic administrator. If you don't have credentials yet, ask your admin to send you an invite.</p>

<h2>Dashboard Overview</h2>
<p>Your dashboard shows all your support tickets at a glance. You can:</p>
<ul>
<li><strong>Filter tickets</strong> by status (Open, Closed)</li>
<li><strong>Search</strong> across all your tickets</li>
<li><strong>Sort</strong> by creation or last updated date</li>
<li><strong>Create</strong> new tickets with the Create button</li>
</ul>

<h2>Knowledge Base</h2>
<p>Before creating a ticket, check our Knowledge Base for instant answers to common questions. Articles are organized by category and fully searchable.</p>

<h2>Need Help?</h2>
<p>If you can't find what you need, create a support ticket and our team will get back to you promptly. For urgent issues, set the priority to High or Critical.</p>`,
    category: 'Getting Started',
    author: 'SMYLS Support Team',
    status: 'Published',
    is_public: true,
    views: 342,
    helpful_count: 28,
    creation: '2025-11-15T10:00:00.000Z',
    modified: '2026-02-01T14:00:00.000Z',
    owner: 'SMYLS Support Team',
  },
  {
    name: 'KB-002',
    title: 'How to Create and Track Support Tickets',
    content: `<h1>How to Create and Track Support Tickets</h1>
<p>This guide walks you through creating effective support tickets and tracking their progress.</p>

<h2>Creating a Ticket</h2>
<ol>
<li>Click <strong>Create</strong> from the dashboard</li>
<li>Select the appropriate <strong>Ticket Type</strong></li>
<li>Write a clear, descriptive <strong>Subject</strong></li>
<li>Provide detailed information in the <strong>Description</strong> — use the rich text editor for formatting, images, and links</li>
<li>Click <strong>Create</strong> to submit</li>
</ol>

<h2>Writing Effective Descriptions</h2>
<p>Help us help you faster by including:</p>
<ul>
<li>Steps to reproduce the issue</li>
<li>Expected vs actual behavior</li>
<li>Screenshots or error messages</li>
<li>Which devices/browsers are affected</li>
</ul>

<h2>Tracking Your Ticket</h2>
<p>Tickets move through these statuses:</p>
<ul>
<li><strong>Open</strong> — Submitted and being worked on</li>
<li><strong>Closed</strong> — Ticket completed</li>
</ul>

<h2>Replying to Tickets</h2>
<p>You can add replies to open tickets to provide additional information or follow up. Use the conversation thread at the bottom of any ticket detail page.</p>`,
    category: 'Tickets',
    author: 'SMYLS Support Team',
    status: 'Published',
    is_public: true,
    views: 187,
    helpful_count: 15,
    creation: '2025-12-01T09:00:00.000Z',
    modified: '2026-01-15T11:00:00.000Z',
    owner: 'SMYLS Support Team',
  },
  {
    name: 'KB-003',
    title: 'Troubleshooting Common Login Issues',
    content: `<h1>Troubleshooting Common Login Issues</h1>
<p>Having trouble signing in? Here are solutions to the most common login problems.</p>

<h2>"Invalid Credentials" Error</h2>
<ol>
<li>Double-check your email for typos</li>
<li>Make sure Caps Lock is off</li>
<li>Try resetting your password via "Forgot password?"</li>
</ol>

<h2>Login Page Keeps Refreshing</h2>
<ol>
<li>Clear your browser cache and cookies</li>
<li>Try an incognito/private browsing window</li>
<li>Ensure JavaScript and cookies are enabled</li>
<li>Try a different browser (Chrome, Firefox, Safari)</li>
</ol>

<h2>"Access Denied" After Login</h2>
<p>This usually means your account hasn't been fully activated. Contact your clinic administrator to verify your account status and permissions.</p>

<h2>Still Can't Log In?</h2>
<p>If none of the above helps, contact us at <strong>support@smyls.ca</strong> with your email address and a description of the error you're seeing.</p>`,
    category: 'Troubleshooting',
    author: 'SMYLS Technical Team',
    status: 'Published',
    is_public: true,
    views: 456,
    helpful_count: 34,
    creation: '2025-10-20T08:00:00.000Z',
    modified: '2026-02-10T16:00:00.000Z',
    owner: 'SMYLS Technical Team',
  },
  {
    name: 'KB-004',
    title: 'Understanding Ticket Priority Levels',
    content: `<h1>Understanding Ticket Priority Levels</h1>
<p>Choosing the right priority level helps us respond appropriately and route your request to the right team.</p>

<h2>Priority Levels</h2>

<h3>Critical</h3>
<p><strong>Use when:</strong> System is down, patient data at risk, or critical business functions are completely blocked.</p>
<p><strong>Response time:</strong> Within 1 hour</p>

<h3>High</h3>
<p><strong>Use when:</strong> Major feature is broken, significant workflow disruption, no workaround available.</p>
<p><strong>Response time:</strong> Within 4 hours (business hours)</p>

<h3>Medium</h3>
<p><strong>Use when:</strong> Non-critical bugs, feature requests, questions with a workaround available.</p>
<p><strong>Response time:</strong> Within 1 business day</p>

<h3>Low</h3>
<p><strong>Use when:</strong> Minor enhancements, documentation questions, general feedback.</p>
<p><strong>Response time:</strong> Within 2-3 business days</p>

<h2>Tips</h2>
<ul>
<li>Be honest about impact — it helps us prioritize across all clinics</li>
<li>Include how many people are affected</li>
<li>Mention if a workaround exists</li>
</ul>`,
    category: 'Best Practices',
    author: 'SMYLS Support Team',
    status: 'Published',
    is_public: true,
    views: 123,
    helpful_count: 9,
    creation: '2025-12-15T13:00:00.000Z',
    modified: '2026-01-20T10:00:00.000Z',
    owner: 'SMYLS Support Team',
  },
  {
    name: 'KB-005',
    title: 'Setting Up Automated Appointment Reminders',
    content: `<h1>Setting Up Automated Appointment Reminders</h1>
<p>Reduce no-shows by configuring automated SMS and email reminders for your patients.</p>

<h2>Prerequisites</h2>
<ul>
<li>Admin access to your clinic settings</li>
<li>Valid SMS provider configured (contact support if needed)</li>
<li>Patient email addresses and/or phone numbers on file</li>
</ul>

<h2>Configuration Steps</h2>
<ol>
<li>Navigate to <strong>Settings &gt; Notifications</strong></li>
<li>Enable <strong>Appointment Reminders</strong></li>
<li>Choose your reminder channels (Email, SMS, or both)</li>
<li>Set the reminder timing (e.g., 24 hours before, 2 hours before)</li>
<li>Customize the message template</li>
<li>Click <strong>Save</strong></li>
</ol>

<h2>Message Templates</h2>
<p>You can use these variables in your templates:</p>
<ul>
<li><code>{patient_name}</code> — Patient's full name</li>
<li><code>{appointment_date}</code> — Date of the appointment</li>
<li><code>{appointment_time}</code> — Time of the appointment</li>
<li><code>{provider_name}</code> — Provider's name</li>
<li><code>{clinic_name}</code> — Your clinic name</li>
<li><code>{clinic_phone}</code> — Your clinic phone number</li>
</ul>

<h2>Best Practices</h2>
<ul>
<li>Send reminders 24 hours and 2 hours before the appointment</li>
<li>Keep messages concise and include a way to confirm or reschedule</li>
<li>Test with a staff member's contact info before going live</li>
</ul>`,
    category: 'How-To Guides',
    author: 'SMYLS Product Team',
    status: 'Published',
    is_public: true,
    views: 210,
    helpful_count: 18,
    creation: '2026-01-10T09:00:00.000Z',
    modified: '2026-02-28T14:00:00.000Z',
    owner: 'SMYLS Product Team',
  },
  {
    name: 'KB-006',
    title: 'Managing User Accounts and Permissions',
    content: `<h1>Managing User Accounts and Permissions</h1>
<p>Learn how to invite team members, manage their access levels, and keep your clinic's data secure.</p>

<h2>Inviting New Users</h2>
<ol>
<li>Go to <strong>Settings &gt; Team Members</strong></li>
<li>Click <strong>Invite User</strong></li>
<li>Enter their email address</li>
<li>Select their role (Front Desk, Provider, Admin)</li>
<li>Click <strong>Send Invite</strong></li>
</ol>
<p>The invitee will receive an email with a secure link to set up their account.</p>

<h2>User Roles</h2>
<ul>
<li><strong>Admin</strong> — Full access to all settings, users, and data</li>
<li><strong>Provider</strong> — Access to patient charts, scheduling, and clinical tools</li>
<li><strong>Front Desk</strong> — Access to scheduling, check-in/out, and billing</li>
</ul>

<h2>Security Best Practices</h2>
<ul>
<li>Remove access promptly when team members leave</li>
<li>Use unique accounts — never share login credentials</li>
<li>Review the team member list quarterly</li>
</ul>`,
    category: 'How-To Guides',
    author: 'SMYLS Support Team',
    status: 'Published',
    is_public: true,
    views: 95,
    helpful_count: 7,
    creation: '2026-02-05T11:00:00.000Z',
    modified: '2026-03-01T09:00:00.000Z',
    owner: 'SMYLS Support Team',
  },
];

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}
