from flask import Flask, render_template, request, make_response
from weasyprint import HTML
from num2words import num2words
import io

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

def calculate_invoice_data(form):
    customer_name = form.get('customer_name', '')
    customer_address1 = form.get('customer_address1', '')
    customer_address2 = form.get('customer_address2', '')
    contact_no = form.get('contact_no', '')
    customer_gstin = form.get('customer_gstin', '')
    invoice_no = form.get('invoice_no', '')
    invoice_date = form.get('invoice_date', '')

    # Parse items
    items = []
    i = 0
    while f'description_{i}' in form:
        if form.get(f'description_{i}'):
            qty = float(form.get(f'qty_{i}', 0))
            rate = float(form.get(f'rate_{i}', 0))
            amount = qty * rate
            item = {
                'no': i + 1,
                'description': form.get(f'description_{i}', ''),
                'hsn': form.get(f'hsn_{i}', ''),
                'unit': form.get(f'unit_{i}', ''),
                'qty': qty,
                'rate': rate,
                'amount': amount
            }
            items.append(item)
        i += 1

    # Calculate totals
    taxable_amount = sum(item['amount'] for item in items)
    cgst = round(taxable_amount * 0.09, 2)
    sgst = round(taxable_amount * 0.09, 2)
    grand_total_wo_round = taxable_amount + cgst + sgst
    grand_total = round(grand_total_wo_round)
    round_off = round(grand_total - grand_total_wo_round, 2)

    # Convert to words
    amount_in_words = num2words(int(grand_total), lang='en_IN').upper()
    decimal_part = int((grand_total - int(grand_total)) * 100)
    if decimal_part > 0:
        amount_in_words += f" POINT {num2words(decimal_part, lang='en_IN').upper()}"

    # Get bank details
    bank_option = form.get('bank_option', '1')
    if bank_option == '1':
        bank_name = "SARASPUR NAGRIK CO.OP BANK LTD"
        account_no = "006111101000508"
        ifsc = "SNBK0000006"
    else:
        bank_name = "AU SMALL FINANCE BANK, KUDASAN, GANDHINAGAR"
        account_no = "2121253033849380"
        ifsc = "AUBL0002530"

    return {
        'customer_name': customer_name,
        'customer_address1': customer_address1,
        'customer_address2': customer_address2,
        'contact_no': contact_no,
        'customer_gstin': customer_gstin,
        'invoice_no': invoice_no,
        'invoice_date': invoice_date,
        'items': items,
        'taxable_amount': taxable_amount,
        'cgst': cgst,
        'sgst': sgst,
        'round_off': round_off,
        'grand_total': grand_total,
        'amount_in_words': amount_in_words,
        'bank_name': bank_name,
        'account_no': account_no,
        'ifsc': ifsc
    }

@app.route('/generate_invoice', methods=['POST'])
def generate_invoice():
    data = calculate_invoice_data(request.form)

    invoice_html = render_template('invoice.html', **data)

    # ✅ This base_url is critical for loading CSS in PDF
    html = HTML(string=invoice_html, base_url=request.host_url)

    pdf_file = io.BytesIO()
    html.write_pdf(target=pdf_file)
    pdf_file.seek(0)

    response = make_response(pdf_file.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename=PATEL_CONSTRUCTION_INVOICE_{data["invoice_no"]}.pdf'
    return response


@app.route('/preview_invoice', methods=['POST'])
def preview_invoice():
    data = calculate_invoice_data(request.form)
    invoice_html = render_template('invoice.html', **data)
    return invoice_html

if __name__ == '__main__':
    app.run(debug=True)
