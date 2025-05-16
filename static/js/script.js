document.addEventListener("DOMContentLoaded", () => {
  // Variables
  const itemsTable = document.getElementById("itemsTable")
  const itemsBody = document.getElementById("itemsBody")
  const addItemBtn = document.getElementById("addItemBtn")
  const taxableAmountInput = document.getElementById("taxable_amount")
  const cgstInput = document.getElementById("cgst")
  const sgstInput = document.getElementById("sgst")
  const roundOffInput = document.getElementById("round_off")
  const grandTotalInput = document.getElementById("grand_total")
  const previewBtn = document.getElementById("previewBtn")
  const previewModal = document.getElementById("previewModal")
  const previewContent = document.getElementById("previewContent")
  const closePreviewBtn = document.getElementById("closePreviewBtn")
  const closeSpan = document.querySelector(".close")

  let itemCount = 1

  // Add item row
  addItemBtn.addEventListener("click", () => {
    const newRow = document.createElement("tr")
    newRow.className = "item-row"
    newRow.innerHTML = `
            <td>${itemCount + 1}</td>
            <td><input type="text" name="description_${itemCount}" required></td>
            <td><input type="text" name="hsn_${itemCount}"></td>
            <td><input type="text" name="unit_${itemCount}" placeholder="SQFT"></td>
            <td><input type="number" name="qty_${itemCount}" step="0.01" class="qty" required></td>
            <td><input type="number" name="rate_${itemCount}" step="0.01" class="rate" required></td>
            <td><input type="number" name="amount_${itemCount}" step="0.01" class="amount" readonly></td>
            <td><button type="button" class="remove-btn"><i class="fas fa-trash"></i></button></td>
        `
    itemsBody.appendChild(newRow)
    itemCount++

    // Enable all remove buttons if there's more than one row
    if (itemCount > 1) {
      const removeButtons = document.querySelectorAll(".remove-btn")
      removeButtons.forEach((btn) => (btn.disabled = false))
    }

    // Add event listeners to new inputs
    addInputListeners(newRow)
  })

  // Remove item row
  itemsBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn") || e.target.parentElement.classList.contains("remove-btn")) {
      const button = e.target.classList.contains("remove-btn") ? e.target : e.target.parentElement
      const row = button.closest("tr")
      row.remove()
      itemCount--

      // Renumber rows
      const rows = itemsBody.querySelectorAll("tr")
      rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1
      })

      // Disable remove button if only one row left
      if (itemCount === 1) {
        const removeButton = document.querySelector(".remove-btn")
        if (removeButton) removeButton.disabled = true
      }

      // Recalculate totals
      calculateTotals()
    }
  })

  // Calculate amount when quantity or rate changes
  function addInputListeners(row) {
    const qtyInput = row.querySelector(".qty")
    const rateInput = row.querySelector(".rate")
    const amountInput = row.querySelector(".amount")

    qtyInput.addEventListener("input", () => {
      calculateAmount(qtyInput, rateInput, amountInput)
    })

    rateInput.addEventListener("input", () => {
      calculateAmount(qtyInput, rateInput, amountInput)
    })
  }

  // Calculate amount
  function calculateAmount(qtyInput, rateInput, amountInput) {
    const qty = Number.parseFloat(qtyInput.value) || 0
    const rate = Number.parseFloat(rateInput.value) || 0
    const amount = qty * rate
    amountInput.value = amount.toFixed(2)

    // Recalculate totals
    calculateTotals()
  }

  // Calculate totals
  function calculateTotals() {
    const amountInputs = document.querySelectorAll(".amount")
    let taxableAmount = 0

    amountInputs.forEach((input) => {
      taxableAmount += Number.parseFloat(input.value) || 0
    })

    const cgst = taxableAmount * 0.09
    const sgst = taxableAmount * 0.09
    const roundOff = Number.parseFloat(roundOffInput.value) || 0
    const grandTotal = taxableAmount + cgst + sgst + roundOff

    taxableAmountInput.value = taxableAmount.toFixed(2)
    cgstInput.value = cgst.toFixed(2)
    sgstInput.value = sgst.toFixed(2)
    grandTotalInput.value = grandTotal.toFixed(2)
  }

  // Round off input change
  roundOffInput.addEventListener("input", calculateTotals)

  // Preview invoice
  previewBtn.addEventListener("click", () => {
    const formData = new FormData(document.getElementById("invoiceForm"))

    fetch("/preview_invoice", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.text())
      .then((html) => {
        previewContent.innerHTML = html
        previewModal.style.display = "block"
      })
      .catch((error) => {
        console.error("Error:", error)
        alert("Error generating preview. Please try again.")
      })
  })

  // Close preview modal
  closePreviewBtn.addEventListener("click", () => {
    previewModal.style.display = "none"
  })

  closeSpan.addEventListener("click", () => {
    previewModal.style.display = "none"
  })

  window.addEventListener("click", (event) => {
    if (event.target === previewModal) {
      previewModal.style.display = "none"
    }
  })

  // Add listeners to the first row
  addInputListeners(itemsBody.querySelector("tr"))

  // Format date input to current date
  const dateInput = document.getElementById("invoice_date")
  const today = new Date()
  const formattedDate = today.toISOString().substr(0, 10)
  dateInput.value = formattedDate
})
