/* script.js — shared site logic for signup/login/profile/chatbot */

/* ---------------- Utilities ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function saveUsers(users){
  localStorage.setItem('cp_users', JSON.stringify(users || []));
}
function loadUsers(){
  try {
    return JSON.parse(localStorage.getItem('cp_users') || '[]');
  } catch (e) { return []; }
}
function setCurrent(user){
  localStorage.setItem('cp_current', JSON.stringify(user));
}
function getCurrent(){
  try { return JSON.parse(localStorage.getItem('cp_current') || 'null'); } catch(e){ return null; }
}
function logoutAndRedirect(){
  localStorage.removeItem('cp_current');
  location.href = 'login.html';
}

/* set years in footers if present */
const years = ['year','year2','year3','year4','year5'];
years.forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.textContent = new Date().getFullYear();
});

/* ---------------- Signup ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{

  const signupForm = $('#signupForm');
  if(signupForm){
    signupForm.addEventListener('submit', e=>{
      e.preventDefault();
      const name = $('#name').value.trim();
      const email = $('#email').value.trim().toLowerCase();
      const dob = $('#dob').value;
      const password = $('#password').value;

      const errorEl = $('#signupError');

      if(!name || !email || !dob || password.length < 6){
        errorEl.textContent = 'Please fill all fields. Password must be at least 6 characters.';
        return;
      }

      const users = loadUsers();
      if(users.find(u => u.email === email)){
        errorEl.textContent = 'An account with this email already exists.';
        return;
      }

      const newUser = { id: Date.now(), name, email, dob, password };
      users.push(newUser);
      saveUsers(users);
      // redirect to login
      location.href = 'login.html';
    });
  }

  /* ---------------- Login ---------------- */
  const loginForm = $('#loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', e=>{
      e.preventDefault();
      const email = $('#loginEmail').value.trim().toLowerCase();
      const pw = $('#loginPassword').value;
      const err = $('#loginError');
      const users = loadUsers();
      const user = users.find(u => u.email === email && u.password === pw);
      if(!user){
        err.textContent = 'Invalid email or password.';
        return;
      }
      setCurrent(user);
      // redirect to profile
      location.href = 'profile.html';
    });
  }

  /* ---------------- Profile ---------------- */
  const profilePage = document.querySelector('.profile-page');
  if(profilePage){
    const current = getCurrent();
    if(!current){
      // not logged in
      location.href = 'login.html';
      return;
    }

    // render profile
    const nameEl = $('#profileName');
    const emailEl = $('#profileEmail');
    const dobEl = $('#profileDOB');
    const sunEl = $('#sunSign');
    const avatar = $('#profilePic');

    nameEl.textContent = current.name;
    emailEl.textContent = current.email;
    dobEl.textContent = `DOB: ${current.dob}`;

    // placeholder avatar gradient with initials
    avatar.src = createAvatarDataURL(current.name);

    const sign = getZodiacSignFromDOB(current.dob);
    sunEl.textContent = sign ? sign : 'Unknown';

    // edit profile
    const editModal = $('#editModal');
    const editBtn = $('#editProfileBtn');
    const cancelBtn = $('#cancelEdit');
    const editForm = $('#editForm');

    $('#editName').value = current.name;
    $('#editEmail').value = current.email;
    $('#editDob').value = current.dob;

    editBtn.addEventListener('click', ()=> {
      editModal.setAttribute('aria-hidden', 'false');
    });
    cancelBtn.addEventListener('click', ()=> {
      editModal.setAttribute('aria-hidden', 'true');
    });

    editForm.addEventListener('submit', e=>{
      e.preventDefault();
      const newName = $('#editName').value.trim();
      const newEmail = $('#editEmail').value.trim().toLowerCase();
      const newDob = $('#editDob').value;
      if(!newName || !newEmail || !newDob) return;
      // update stored user
      let users = loadUsers();
      users = users.map(u => {
        if(u.email === current.email && u.password === current.password && u.id === current.id){
          return {...u, name:newName, email:newEmail, dob:newDob};
        }
        return u;
      });
      saveUsers(users);
      const updated = users.find(u => u.id === current.id);
      setCurrent(updated);
      // update UI quickly
      nameEl.textContent = updated.name;
      emailEl.textContent = updated.email;
      dobEl.textContent = `DOB: ${updated.dob}`;
      avatar.src = createAvatarDataURL(updated.name);
      sunEl.textContent = getZodiacSignFromDOB(updated.dob);
      editModal.setAttribute('aria-hidden', 'true');
    });

    // logout buttons
    $('#logoutBtn')?.addEventListener('click', logoutAndRedirect);
    $('#logoutBtn2')?.addEventListener('click', logoutAndRedirect);
  }

  /* ---------------- Chatbot ---------------- */
  const chatForm = $('#chatForm');
  if(chatForm){
    const chatWindow = $('#chatWindow');
    const input = $('#chatInput');

    chatForm.addEventListener('submit', e=>{
      e.preventDefault();
      const text = input.value.trim();
      if(!text) return;
      appendMsg(text, 'user');
      input.value = '';
      // bot typing indicator
      appendTyping();
      setTimeout(()=> {
        removeTyping();
        const botText = generateBotResponse(text);
        appendMsg(botText, 'bot');
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }, 700 + Math.random()*700);
    });

    // greet message
    setTimeout(()=> {
      appendMsg("Hello! I'm your Astrology Assistant. Ask about sign personalities, or ask for a daily horoscope (e.g. 'Daily for Taurus').", 'bot');
    }, 400);
  }

  /* ---------------- 'Get Started' quick nav binding ---------------- */
  document.querySelectorAll('[data-link="get-started"]').forEach(btn=>{
    btn.addEventListener('click', ()=> location.href = 'signup.html');
  });

});

/* ---------------- Avatar helper ---------------- */
function createAvatarDataURL(name){
  const initials = (name || 'U').split(' ').map(n=>n[0]||'').slice(0,2).join('').toUpperCase() || 'U';
  const bgA = '#6a00ff';
  const bgB = '#3C096C';
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
    <defs>
      <linearGradient id='g' x1='0' x2='1'>
        <stop offset='0' stop-color='${bgA}'/>
        <stop offset='1' stop-color='${bgB}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='28' fill='url(#g)'/>
    <text x='50%' y='54%' font-family='Poppins, sans-serif' font-weight='700' font-size='120' fill='white' text-anchor='middle' dominant-baseline='middle'>${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svg);
}

/* ---------------- Zodiac detection ---------------- */
/* returns zodiac name from YYYY-MM-DD string or null */
function getZodiacSignFromDOB(dobString){
  if(!dobString) return null;
  // parse date in local time
  const d = new Date(dobString + 'T00:00:00');
  if(isNaN(d)) return null;
  const day = d.getUTCDate(); // use UTC day for consistency
  const month = d.getUTCMonth() + 1; // 1-12

  // boundaries inclusive start dates
  // Aries Mar21, Taurus Apr20, Gemini May21, Cancer Jun21, Leo Jul23, Virgo Aug23,
  // Libra Sep23, Scorpio Oct23, Sagittarius Nov22, Capricorn Dec22, Aquarius Jan20, Pisces Feb19
  if((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries';
  if((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus';
  if((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini';
  if((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer';
  if((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo';
  if((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo';
  if((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra';
  if((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio';
  if((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius';
  if((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn';
  if((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius';
  if((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces';
  return null;
}

/* ---------------- Chatbot knowledge ---------------- */
const personality = {
  'Aries': 'Bold, energetic and pioneering. Aries charges forward and loves a challenge.',
  'Taurus': 'Grounded and sensual. Taurus values comfort, beauty, and steady progress.',
  'Gemini': 'Curious and adaptable. Gemini loves to talk, learn, and connect ideas.',
  'Cancer': 'Caring and intuitive. Cancer keeps close to family and emotional security.',
  'Leo': 'Warm, dramatic and generous. Leo loves creative expression and attention.',
  'Virgo': 'Analytical and practical. Virgo refines, organizes, and improves.',
  'Libra': 'Diplomatic and graceful. Libra seeks balance and beautiful partnerships.',
  'Scorpio': 'Intense, deep and transformational. Scorpio desires truth and passion.',
  'Sagittarius': 'Adventurous and philosophical. Sagittarius seeks growth and freedom.',
  'Capricorn': 'Ambitious and disciplined. Capricorn builds long-term success.',
  'Aquarius': 'Innovative and humanitarian. Aquarius thinks about the future of society.',
  'Pisces': 'Empathetic and dreamy. Pisces connects with imagination and compassion.'
};

const daily = {
  'Aries': 'Today, take the lead on a project — your energy will attract support.',
  'Taurus': 'A slow, steady step brings progress. Treat yourself kindly today.',
  'Gemini': 'A conversation opens a new opportunity. Follow your curiosity.',
  'Cancer': 'Spend time at home or with loved ones; emotional rest nurtures you.',
  'Leo': 'Your confidence shines. Share your creative ideas with the world.',
  'Virgo': 'Tidy up one small mess; clarity will create space for fresh thinking.',
  'Libra': 'Seek harmony in a relationship — a small compromise could help.',
  'Scorpio': 'A revealing conversation may lead to deeper understanding.',
  'Sagittarius': 'Explore a new idea or destination — learning is your gift today.',
  'Capricorn': 'Focus on practical steps; consistent effort will pay off.',
  'Aquarius': 'Share a visionary idea — others may be inspired to join you.',
  'Pisces': 'Trust your intuition; a quiet walk could help you see clearly.'
};

/* generate a bot response based on user input */
function generateBotResponse(input){
  const text = input.toLowerCase();
  // check for "daily" + sign
  for(const sign of Object.keys(daily)){
    if(text.includes('daily') && text.includes(sign.toLowerCase())){
      return `Daily for ${sign}: ${daily[sign]}`;
    }
  }
  // check "what is x personality" or "tell me about aries"
  for(const sign of Object.keys(personality)){
    if(text.includes(sign.toLowerCase())){
      return `${sign}: ${personality[sign]}\n\nWant a daily horoscope? Type "daily for ${sign}".`;
    }
  }
  // generic queries
  if(text.includes('sun sign') || text.includes('zodiac sign') || text.includes('what is my sign')){
    const cur = getCurrent();
    if(cur && cur.dob){
      const sign = getZodiacSignFromDOB(cur.dob);
      if(sign) return `Your sun sign is ${sign}. ${personality[sign] || ''}`;
      else return `I couldn't detect your sign from your DOB. Make sure it's entered in your profile.`;
    } else {
      return `I don't see a logged-in profile. Please login or signup and add your DOB, then ask again.`;
    }
  }
  // fallback suggestions
  if(text.includes('hello') || text.includes('hi')){
    return "Hi! I can give quick sign personalities or daily horoscopes. Try: 'Tell me about Leo' or 'Daily for Pisces'.";
  }
  return "I can help with sign personalities and short daily horoscopes. Try: 'Tell me about Virgo' or 'Daily for Taurus'.";
}

/* ---------------- Chat message helpers ---------------- */
function appendMsg(text, who='bot'){
  const win = $('#chatWindow');
  if(!win) return;
  const msg = document.createElement('div');
  msg.className = 'msg ' + (who === 'user' ? 'user' : 'bot');
  // optional meta for bot
  const p = document.createElement('div');
  p.className = 'meta';
  p.textContent = (who === 'user' ? 'You' : 'Assistant');
  const textEl = document.createElement('div');
  textEl.className = 'text';
  // allow newlines
  textEl.innerHTML = escapeHtml(text).replace(/\n/g,'<br>');
  msg.appendChild(p);
  msg.appendChild(textEl);
  win.appendChild(msg);
  win.scrollTop = win.scrollHeight;
}

function appendTyping(){
  const win = $('#chatWindow');
  if(!win) return;
  const typing = document.createElement('div');
  typing.className = 'msg bot typing';
  typing.id = 'typing';
  typing.innerHTML = `<div class="meta">Assistant</div><div class="text">Typing<span class="dots">...</span></div>`;
  win.appendChild(typing);
  win.scrollTop = win.scrollHeight;
}
function removeTyping(){
  const t = $('#typing');
  if(t) t.remove();
}

/* small helper to escape HTML in messages */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ---------------- small safety default redirect for pages requiring login ---------------- */
/* If on profile.html and not logged in handled above.
   If user clicks Profile button and not logged in, script attached to nav 'Profile' link will redirect in page flow:
*/
document.addEventListener('click', function(e){
  const t = e.target;
  // nav profile button (anchors linking to profile.html will naturally redirect, but we ensure logged in)
  if(t.matches('a[href="profile.html"], .btn[href="profile.html"]')){
    const cur = getCurrent();
    if(!cur){
      e.preventDefault();
      location.href = 'login.html';
    }
  }
});
