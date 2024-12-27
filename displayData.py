import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from tkinter import Tk, filedialog
import numpy as np

def upload_file():
    # Create a GUI window
    root = Tk()
    # Hide the root window
    root.withdraw()
    # Get the file path from file dialog
    file_path = filedialog.askopenfilename()
    return file_path

def animate(i, df, lines, ax):
    # This function will be called periodically by the animation
    for line, column in zip(lines, df.columns):
        if pd.api.types.is_numeric_dtype(df[column]):
            # Update data of each line
            line.set_data(range(len(df[column][:i+1])), df[column][:i+1])

    # Adjust limits if necessary
    ax.relim()
    ax.autoscale_view()

def plot_live_data(file_path):
    # Read the Excel file
    df = pd.read_excel(file_path)

    # Set up the plot
    fig, ax = plt.subplots()
    lines = []
    for column in df.columns:
        if pd.api.types.is_numeric_dtype(df[column]):
            # Only plot numeric data
            line, = ax.plot([], [], label=column)
            lines.append(line)

    # Set the legend outside of the plot area
    ax.legend(loc='center left', bbox_to_anchor=(1, 0.5))

    ax.set_xlabel('Index')
    ax.set_ylabel('Value')
    ax.grid(True)

    # Ensure the window is large enough to see everything
    fig.subplots_adjust(right=0.75)  # Adjust the subplot to make room for the legend

    # Create the animation object
    ani = FuncAnimation(fig, animate, frames=len(df), interval=100, fargs=(df, lines, ax))

    plt.show()

def main():
    # Upload Excel file
    file_path = upload_file()
    if file_path:
        # Plot data as if it's live
        plot_live_data(file_path)
    else:
        print("No file was selected.")

if __name__ == "__main__":
    main()
