document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  //Send email
  document.querySelector('#compose-form').onsubmit = submit_compose_form;
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function submit_compose_form() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  send_email(recipients, subject, body);
  return false;

}

function send_email(recipients, subject, body) {
  
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
    recipients: recipients,
    subject: subject,
    body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    load_mailbox('sent');
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails, mailbox);
      // Print each email
      emails.forEach(email => display_emails(email, mailbox));
  });
}

function display_emails(email, mailbox) {

  //this creates a div for each email
  const element = document.createElement('div');
  element.setAttribute('id', email.id);
  element.setAttribute('class', 'container mail-element');

  //div for the rectangle that includes all the email details
  const row = document.createElement('div');
  row.setAttribute('id', `${email.id}-row`);
  row.setAttribute('class', 'row');

  //white to grey when email is read
  row.style.backgroundColor = email.read ? '#E8E8E8' : 'white';

  const sender = document.createElement('div');
  sender.setAttribute('class', 'sender');
  sender.innerHTML = email.sender;

  const subject = document.createElement('div');
  subject.setAttribute('class', 'subject');
  subject.innerHTML = email.subject;

  const timestamp = document.createElement('div');
  timestamp.setAttribute('class', 'timestamp');
  timestamp.innerHTML = email.timestamp;

  element.addEventListener('click', () => view_email(email.id, mailbox));
  
  //now let's put this all together
  document.querySelector('#emails-view').append(element);
  document.getElementById(email.id).appendChild(row);
  document.getElementById(`${email.id}-row`).appendChild(sender);
  document.getElementById(`${email.id}-row`).appendChild(subject);
  document.getElementById(`${email.id}-row`).appendChild(timestamp);
}

function view_email(email_id, mailbox) {

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    render_email(email, mailbox);
    if(!email.read) {
      mark_as_read(email_id);
    }
  });
}

function render_email(email, mailbox) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  document.getElementById('mailbox').innerHTML = mailbox;
  document.getElementById('email-from').innerHTML = email.sender;
  document.getElementById('email-to').innerHTML = email.recipients;
  document.getElementById('email-subject').innerHTML = email.subject;
  document.getElementById('email-timestamp').innerHTML = email.timestamp;
  document.getElementById('email-body').innerHTML = email.body;

  document.getElementById('reply').addEventListener('click', () => reply(email));

  archive_button(email.id);
}

function reply(email) {

  compose_email();

  const prefill = `${email.subject.substring(0, 4)==='Re: ' ? '' : 'Re: '}${email.subject}`;
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = prefill;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n${email.body}`;
}

function archive(email_id, mailbox) {

  const is_archive = mailbox==='inbox' ? false : true;

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !is_archive
    })
  })
  .then(() => load_mailbox('inbox'));
}

function archive_button(email_id) {

  document.getElementById('archive-button').innerHTML = '';

  const mailbox = document.getElementById('mailbox').innerHTML;
  const button_style = mailbox==='inbox' ? 'primary' : 'secondary';

  if (mailbox !== 'sent') {
    const archive_button = document.createElement('button');
    archive_button.innerHTML = mailbox === 'inbox' ? 'Archive' : 'Unarchive';
    archive_button.setAttribute('class', `btn btn-sm btn-${button_style}`);
    archive_button.setAttribute('id', 'archive');
    archive_button.addEventListener('click', () => archive(email_id, mailbox));
    
    document.getElementById('archive-button').append(archive_button);
  }
}

function mark_as_read(email_id) {

  fetch(`/emails/${email_id}`, {
    method: 'PUT', 
    body: JSON.stringify({
      read:true
    })
  });
}


