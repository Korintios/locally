import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export default function ChatWithIA({ messages, isLoading }) {
	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{messages.map((message, index) => (
				<div
					key={index}
					className={`flex ${
						message.role === "user" ? "justify-end" : "justify-start"
					}`}
				>
					<div
						className={`max-w-[80%] rounded-full px-3 py-2 ${
							message.role === "user" ? "bg-blue-100 text-black" : ""
						}`}
					>
						{message.role === "user" ? (
							<p className="whitespace-pre-wrap font-afacad text-base">
								{message.content}
							</p>
						) : (
							<div className="prose prose-sm max-w-none font-afacad">
								<ReactMarkdown
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeHighlight]}
									components={{
										// Personalizar componentes si es necesario
										code: ({ inline, className, children, ...props }) => (
											<code
												className={`${className} ${
													inline
														? "bg-gray-100 px-1 py-0.5 rounded text-sm"
														: "block bg-gray-900 text-white p-3 rounded-lg my-2 overflow-x-auto"
												}`}
												{...props}
											>
												{children}
											</code>
										),
										p: ({ children }) => (
											<p className="mb-2 last:mb-0">{children}</p>
										),
										ul: ({ children }) => (
											<ul className="list-disc ml-4 mb-2">{children}</ul>
										),
										ol: ({ children }) => (
											<ol className="list-decimal ml-4 mb-2">{children}</ol>
										),
										li: ({ children }) => <li className="mb-1">{children}</li>,
										a: ({ href, children }) => (
											<a
												href={href}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:underline"
											>
												{children}
											</a>
										),
										h1: ({ children }) => (
											<h1 className="text-xl font-bold mb-2 mt-3">
												{children}
											</h1>
										),
										h2: ({ children }) => (
											<h2 className="text-lg font-bold mb-2 mt-3">
												{children}
											</h2>
										),
										h3: ({ children }) => (
											<h3 className="text-base font-bold mb-2 mt-2">
												{children}
											</h3>
										),
										blockquote: ({ children }) => (
											<blockquote className="border-l-4 border-gray-300 pl-3 my-2 italic">
												{children}
											</blockquote>
										),
										table: ({ children }) => (
											<div className="overflow-x-auto my-2">
												<table className="min-w-full border-collapse border border-gray-300">
													{children}
												</table>
											</div>
										),
										th: ({ children }) => (
											<th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold">
												{children}
											</th>
										),
										td: ({ children }) => (
											<td className="border border-gray-300 px-3 py-2">
												{children}
											</td>
										),
									}}
								>
									{message.content}
								</ReactMarkdown>
							</div>
						)}
					</div>
				</div>
			))}

			{/* Mensaje de "Pensando..." */}
			{isLoading && (
				<div className="flex justify-start">
					<div className="px-3">
						<div className="flex items-center space-x-2">
							<div className="flex space-x-1">
								<div className="size-1.5 bg-gray-400 rounded-full animate-bounce"></div>
								<div className="size-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
								<div className="size-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
							</div>
							<span className="text-gray-600 font-afacad">Pensando...</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
