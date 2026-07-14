Import stack:

 node_modules\expo-file-system\src\pathUtilities\index.ts
 | import "./path"

 node_modules\expo-file-system\src\FileSystem.ts
 | import "./pathUtilities"

 node_modules\expo-file-system\src\index.ts
 | import "./FileSystem"

 app\reports.tsx
 | import "expo-file-system"

 app (require.context)