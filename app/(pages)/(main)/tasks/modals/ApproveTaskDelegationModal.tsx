"use client";
import ButtonPrimary from "@/app/components/ButtonPrimary";
import PopupModalLayout from "@/app/components/PopupModalLayout";
import { TaskActivity } from "@/app/models/task.model";
import Link from "next/link";
import { useContext } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { toast } from 'react-toastify';
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { formatDateTime } from "@/app/utils/helper";
import { TaskAPI } from "@/app/services/task.service";
import { useRequest, useLockFn } from "ahooks";

type ApproveTaskDelegationModalProps = {
    taskActivity: TaskActivity;
    toggleModal: () => void;
    onSuccess: () => void;
};

const ApproveTaskDelegationModal = ({ taskActivity, toggleModal, onSuccess }: ApproveTaskDelegationModalProps) => {
    const { activeTask, setActiveTask } = useContext(ActiveTaskContext);
    
    const { loading: delegating, run: delegateTask } = useRequest(
        useLockFn(() => TaskAPI.acceptTaskApplication(activeTask!.id, taskActivity.user!.userId)), 
        {
            manual: true,
            onSuccess: (data) => {
                toast.success("Task delegated successfully.");
                if (data) {
                    setActiveTask({ ...activeTask!, ...data})
                }
                toggleModal();
                onSuccess();
            },
            onError: (error: any) => {
                if (error?.error?.message) {
                    toast.error(error.error.message);
                    return
                }
                toast.error("Failed to delegate task. Please try again.");
            }
        }
    );

    return (
        <PopupModalLayout title="Approve Task Delegation" toggleModal={toggleModal}>
            <div className="space-y-[5px] text-body-tiny mt-5">
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">Developer:</p>
                    <div className="flex items-center gap-1">
                        <span className="text-light-100 underline truncate">
                            @{taskActivity.user?.username}
                        </span>
                        <Link href={`https://github.com/${taskActivity.user?.username}`} target="_blank">
                            <FiArrowUpRight className="text-2xl text-primary-100 hover:text-light-100" />
                        </Link>
                    </div>
                </div>
                <div className="w-full flex items-center justify-between gap-10">
                    <p className="text-primary-400">GitHub Issue:</p>
                    <div className="flex items-center gap-1">
                        <span className="text-light-100 underline truncate">{activeTask?.issue.url}</span>
                        <Link href={activeTask?.issue.url || ""} target="_blank">
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
                Once you click “<span className="font-bold">Yes, Delegate Task,</span>” the task/issue will be 
                delegated to this developer and you can’t assign it to another developer till the timeline elapses.
            </p>
            <div className="flex gap-2.5">
                <ButtonPrimary
                    format="OUTLINE"
                    text="Go Back"
                    attributes={{
                        onClick: toggleModal,
                        disabled: delegating
                    }}
                />
                <ButtonPrimary
                    format="SOLID"
                    text={delegating ? "Delegating..." : "Yes, Delegate Task"}
                    sideItem={<FiArrowUpRight />}
                    attributes={{
                        onClick: delegateTask,
                        disabled: delegating
                    }}
                />
            </div>
        </PopupModalLayout>
    );
}
 
export default ApproveTaskDelegationModal;