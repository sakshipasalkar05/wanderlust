// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})();

// Image preview for file inputs marked with data-preview="#some-img-id"
(() => {
  'use strict'

  document.querySelectorAll('input[type="file"][data-preview]').forEach(input => {
    const preview = document.querySelector(input.dataset.preview)
    if (!preview) return

    let currentUrl = null

    input.addEventListener('change', () => {
      // Free the previous preview from memory
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
        currentUrl = null
      }

      const file = input.files[0]
      if (file && file.type.startsWith('image/')) {
        currentUrl = URL.createObjectURL(file)
        preview.src = currentUrl
        preview.classList.remove('d-none')
      } else {
        preview.removeAttribute('src')
        preview.classList.add('d-none')
      }
    })
  })
})();

// Auto-hide flash messages: any element with data-autohide="<milliseconds>"
(() => {
  'use strict'

  document.querySelectorAll('[data-autohide]').forEach(alertBox => {
    const delay = Number(alertBox.dataset.autohide) || 4000

    setTimeout(() => {
      alertBox.style.transition = 'opacity 0.5s'
      alertBox.style.opacity = '0'
      setTimeout(() => alertBox.remove(), 500)
    }, delay)
  })
})()