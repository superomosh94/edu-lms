document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('.toggle-password');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.setAttribute('aria-pressed', (!showing).toString());
      // Swap icon/text when present
      const eyeOpen = btn.querySelector('#eyeOpen');
      const eyeClosed = btn.querySelector('#eyeClosed');
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = showing ? 'block' : 'none';
        eyeClosed.style.display = showing ? 'none' : 'block';
      } else {
        btn.textContent = showing ? '👁' : '🙈';
      }
    });
  });
});


