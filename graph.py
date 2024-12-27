import matplotlib.pyplot as plt
from tkinter import filedialog
import tkinter as tk
import pandas as pd

# Load dataset
root = tk.Tk()
root.withdraw()  # Use to hide tkinter window
file_path = filedialog.askopenfilename()
soil_data = pd.read_excel(file_path)
root.destroy()

# Create individual graphs for each column, excluding the ID column
columns = soil_data.columns[1:]  # Excluding the ID column

# Create a figure to hold the plots
fig, axes = plt.subplots(len(columns), 1, figsize=(10, 5 * len(columns)))

for i, col in enumerate(columns):
    axes[i].plot(soil_data[col])
    axes[i].set_title(col)
    axes[i].set_xlabel('Index')
    axes[i].set_ylabel(col)

plt.tight_layout()
plt.show()
