"use client";
import ButtonPrimary from "@/app/components/ButtonPrimary";
import MoneyInput from "@/app/components/Input/MoneyInput";
import PopupModalLayout from "@/app/components/PopupModalLayout";
import { useContext, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { ActiveTaskContext } from "../page";
import Image from "next/image";
import { TaskAPI } from "@/app/services/task.service";
import { handleApiError } from "@/app/utils/helper";
import { toast } from "react-toastify";
import { OctokitContext } from "../../layout";
import { updateIssueComment } from "@/app/services/github.service";
import { customBountyMessage } from "@/app/utils/data";

type SetTaskBountyModalProps = {
    toggleModal: () => void;
};

// TODO: Ensure bountyCommentId is valid. If not, get comment id from issue comments
const SetTaskBountyModal = ({ toggleModal }: SetTaskBountyModalProps) => {
    const octokit = useContext(OctokitContext);
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    const [newBounty, setNewBounty] = useState("");
    const [loading, setLoading] = useState(false);
    
    const updateBounty = async () => {
        setLoading(true);

        try {
            const updatedTask = await TaskAPI.updateTaskBounty(
                activeTask!.id, { newBounty }
            );

            // Update bounty comment body on GitHub
            try {
                await updateIssueComment(
                    activeTask!.issue.repository_url,
                    octokit!,
                    activeTask!.issue.bountyCommentId!,
                    customBountyMessage(newBounty, activeTask!.id)
                );

                setActiveTask({ ...activeTask!, ...updatedTask });
                toast.success("Bounty updated successfully.");
                toggleModal();
            } catch (error) {
                console.log(error);
                setActiveTask({ ...activeTask!, ...updatedTask });
                toast.info("Bounty updated, but failed to update GitHub comment.");
                toggleModal();
            }
        } catch (error) {
            handleApiError(error, "Failed to update task bounty.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <PopupModalLayout title="Set Task Bounty" toggleModal={toggleModal}>
            <p className="mt-2.5 text-body-medium text-dark-100">
                Set bounty for this task (issue) for contributors to take on. 
                Reload the GitHub issue URL to see bounty update.
            </p>
            <div className="w-full p-[15px] border border-primary-200 bg-dark-400 flex items-start gap-2.5 mt-5 mb-2.5">
                <p className="text-body-tiny tracking-[-3%] text-primary-100" style={{ lineHeight: "20px" }}>#0032</p>
                <p className="text-body-medium font-bold text-light-100 line-clamp-2">
                    Remove hardcoded model name check and replace with configurable param
                </p>
            </div>
            <div className="relative">
                <Image 
                    src="/usdc.svg" 
                    alt="$" 
                    width={16}
                    height={16}
                    className="absolute top-1/2 -translate-y-1/2 left-2.5" 
                />
                <MoneyInput 
                    attributes={{
                        id: "bounty",
                        name: "bounty",
                        placeholder: "0.00",
                        className: "w-full p-2.5 pl-[42px] bg-dark-400 border border-dark-100 text-body-small text-light-100",
                        value: newBounty,
                        disabled: loading,
                    }}
                    defaultValue={activeTask?.bounty}
                    setValue={(value) => setNewBounty(value)}
                />
            </div>
            <ButtonPrimary
                format="SOLID"
                text="Update Bounty"
                sideItem={<FiArrowRight />}
                attributes={{
                    onClick: updateBounty,
                    disabled: Boolean(newBounty === activeTask?.bounty.toString() || !newBounty.trim()) || loading,
                }}
                extendedClassName="w-fit mt-5"
            />
        </PopupModalLayout>
    );
}
 
export default SetTaskBountyModal;