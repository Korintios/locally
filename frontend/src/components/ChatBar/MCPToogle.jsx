import { Switch } from "@heroui/react";

function MCPToggle({ icon, name, isActive, onToggle }) {
	return (
		<div className="flex items-center gap-2 px-1.5 rounded-lg hover:bg-gray-50 transition-colors">
			<div className="size-5 shrink-0">{icon}</div>
			<span className="text-md text-slate-400 flex-1 text-left font-['Afacad',sans-serif]">
				{name}
			</span>
			<Switch
				size="sm"
				isSelected={isActive}
				onValueChange={onToggle}
			/>
		</div>
	);
}

export default MCPToggle;