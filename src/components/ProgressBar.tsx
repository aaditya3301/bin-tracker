interface ProgressBarProps {
  progress: number; // Progress percentage (0 to 100)
}

const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-green-400 to-teal-500" 
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </div>
  );
};

export default ProgressBar;