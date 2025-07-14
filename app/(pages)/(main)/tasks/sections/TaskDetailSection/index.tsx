"use client";
import DetailsView from "./views/DetailsView";
import ConversationView from "./views/ConversationView";
import { useContext, useState } from "react";
import { ActiveTaskContext } from "../../page";

const TaskDetailSection = () => {
    const { activeTask } = useContext(ActiveTaskContext);
    const [activeView, setActiveView] = useState(viewOptions[0]);
    
    return (
        <section className="grow pt-5 border-x border-dark-200 flex flex-col">
            {(activeTask && activeTask.status === "OPEN") ? (
                <DetailsView />
            ):(
                <>
                    <div className="px-5 flex gap-[15px] text-title-large text-dark-200">
                        {viewOptions.map((option) => (
                            <button 
                                key={option.name} 
                                className={`group h-[50px] px-[5px] flex items-center gap-[7px] border-b 
                                    ${activeView.name === option.name 
                                        ? "border-light-100 text-light-100" 
                                        : "border-transparent hover:text-primary-400"}
                                `}
                                onClick={() => setActiveView(option)}
                            >
                                <span>{option.name}</span>
                                {option.tag && (
                                    <span className={`px-[5px] text-body-medium font-bold text-dark-500 
                                        ${activeView.name !== option.name ? "bg-light-200 group-hover:bg-primary-400" : "bg-primary-100"}`}
                                    >
                                        {option.tag}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {activeView.name === "Description" ? (
                        <DetailsView />
                    ):(
                        <ConversationView />
                    )}
                </>
            )}
        </section>
    );
}
 
export default TaskDetailSection;

const viewOptions = [
    { name: "Description" },
    { name: "Conversation", tag: 2 }
]