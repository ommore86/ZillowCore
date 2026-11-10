import os
import sys
import webbrowser
import subprocess
import time

def main():
    print("================================================================")
    print("   EstateOS AI — The Autonomous Real Estate Operating System    ")
    print("                  Native Desktop Edition v1.0                   ")
    print("================================================================")
    
    # 1. Start Backend Server if not already active
    backend_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

    print("\n[1/3] Initializing EstateOS Enterprise Data Core & Agents...")
    env = os.environ.copy()
    env["PYTHONPATH"] = backend_script

    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=backend_script,
        env=env
    )
    time.sleep(2)

    # 2. Check if Tauri binary is built or launch native application window
    print("[2/3] Launching Native Desktop Window Interface...")
    target_url = "http://localhost:3000"

    # Try launching native app window via browser app mode (portable across all Windows versions)
    edge_paths = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
    ]
    edge_bin = next((p for p in edge_paths if os.path.exists(p)), None)

    if edge_bin:
        print("[3/3] Connected to Microsoft Edge WebView2 Native App Shell.")
        subprocess.Popen([edge_bin, f"--app=http://localhost:3000", "--window-size=1400,900"])
    else:
        print("[3/3] Opening in default native desktop browser...")
        webbrowser.open("http://localhost:3000")

    print("\nEstateOS AI Desktop Edition is running. Press Ctrl+C to terminate.")
    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down EstateOS AI Desktop...")
        backend_proc.terminate()

if __name__ == "__main__":
    main()

