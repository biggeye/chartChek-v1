// import hook for loading messages from DB
// import stream listener 
import { useChat } from "@ai-sdk/react";
import { MessageList } from "../../../../components/chat/message-list";
import { MessageInput } from "../../../../components/chat/message-input";


export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params; // get the chat ID from the URL
  const { messages, input, handleInputChange, handleSubmit } = useChat({ id })

  return(
    <div>
      <MessageList 
      messages={messages} 
      />
      <MessageInput 
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      />
    </div>
  )
}