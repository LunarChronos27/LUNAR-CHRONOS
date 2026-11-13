LUNAR CHRONOS — MISSION OPERATIONS PLANNER INSTALLER

1. Download and extract this ZIP into:
   C:\Users\h\Desktop\lunar-chronos

2. Open a NEW PowerShell window (do not close the separate window running the SPICE backend).

3. Run:
   powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\h\Desktop\lunar-chronos\install-planner.ps1"

The installer checks the current App.tsx integration point, backs up App.tsx and App.css, installs the new component, and runs npm run build. It does not modify USTMissionTimeline.tsx, the backend, or browser localStorage.

The planner reads the existing locally stored mission activities. Use REFRESH ACTIVITIES after adding or editing activities. It compares solar elevation and geometric Earth visibility at the start and end of the selected activity for up to two selected reference locations.

Scientific limitations are stated in the interface. This is a geometric snapshot comparison, not a terrain-aware visibility analysis, radio-link assessment, power model, or operational-feasibility determination. The de Gerlache coordinates are flagged as provisional.
