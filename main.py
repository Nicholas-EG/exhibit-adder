import pdfkit
import time

start = time.perf_counter()
pdfkit.from_url('https://google.com', './test.pdf')
end = time.perf_counter()

print(end - start)