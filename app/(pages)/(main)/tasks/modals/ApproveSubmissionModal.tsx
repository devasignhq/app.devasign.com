"use client";
import ButtonPrimary from "@/app/components/ButtonPrimary";
import PopupModalLayout from "@/app/components/PopupModalLayout";
import { TaskActivity } from "@/app/models/task.model";
import { TaskAPI } from "@/app/services/task.service";
import { formatDateTime } from "@/app/utils/helper";
import { useRequest, useLockFn } from "ahooks";
import Link from "next/link";
import { useContext } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { toast } from 'react-toastify';
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";

type ApproveSubmissionModalProps = {
    taskActivity: TaskActivity;
    toggleModal: () => void;
    onSuccess: () => void;
};

const ApproveSubmissionModal = ({ taskActivity, toggleModal, onSuccess }: ApproveSubmissionModalProps) => {
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    
    const { loading: approving, run: approveSubmission } = useRequest(
        useLockFn(() => TaskAPI.validateCompletion(activeTask!.id)), 
        {
            manual: true,
            onSuccess: (data) => {
                toast.success("Submission approved successfully! Bounty disbursed to contributor.");
                
                if (data && "status" in data) {
                    setActiveTask({ ...activeTask!, ...data});
                }
                if (data && "task" in data) {
                    setActiveTask({ ...activeTask!, ...data.task});
                    toast.warn(data.message);
                }
                
                toggleModal();
                onSuccess();
            },
            onError: (error: any) => {
                if (error?.error?.message) {
                    toast.error(error.error.message);
                    return
                }
                toast.error("Failed to approve task submission. Please try again.");
            }
        }
    );
    
    return (
        <PopupModalLayout title="Approve Submission" toggleModal={toggleModal}>
            <div className="space-y-[5px] text-body-tiny mt-5">
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">Pull Request:</p>
                    <div className="flex items-center gap-1">
                        <span className="text-light-100 underline truncate">
                            {taskActivity.taskSubmission?.pullRequest}
                        </span>
                        <Link href={taskActivity.taskSubmission?.pullRequest || ""} target="_blank">
                            <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                        </Link>
                    </div>
                </div>
                {taskActivity.taskSubmission?.attachmentUrl && (
                    <div className="w-full flex items-center justify-between gap-10">
                        <p className="text-primary-400">Attachment:</p>
                        <div className="flex items-center gap-1">
                            <span className="text-light-100 underline truncate">
                                {taskActivity.taskSubmission?.attachmentUrl}
                            </span>
                            <Link href={taskActivity.taskSubmission?.attachmentUrl || ""} target="_blank">
                                <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                            </Link>
                        </div>
                    </div>
                )}
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">Contributor:</p>
                    <div className="flex items-center gap-1">
                        <span className="text-light-100 underline truncate">
                            @{taskActivity.taskSubmission?.user?.username}
                        </span>
                        <Link href={`https://github.com/${taskActivity.taskSubmission?.user?.username}`} target="_blank">
                            <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                        </Link>
                    </div>
                </div>
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">Time:</p>
                    <p className="text-light-100">{formatDateTime(taskActivity.createdAt)}</p>
                </div>
            </div>
            <p className="my-5 text-body-medium text-dark-100">
                Once you click “<span className="font-bold">Pay Contributor</span>” or merge the code 
                successfully in GitHub, the bounty will be paid out to the contributor automatically.
            </p>
            <div className="flex gap-2.5">
                <ButtonPrimary
                    format="OUTLINE"
                    text="Go Back"
                    attributes={{
                        onClick: toggleModal,
                        disabled: approving
                    }}
                />
                <ButtonPrimary
                    format="SOLID"
                    text={approving ? "Approving..." : "Pay Contributor"}
                    sideItem={<FiArrowUpRight />}
                    attributes={{
                        onClick: approveSubmission,
                        disabled: approving
                    }}
                />
            </div>
        </PopupModalLayout>
    );
}
 
export default ApproveSubmissionModal;