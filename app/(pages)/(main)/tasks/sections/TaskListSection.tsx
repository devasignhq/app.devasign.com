"use client";
import FilterDropdown from "@/app/components/Dropdown/Filter";
import { useContext, useEffect, useState } from "react";
import { HiPlus } from "react-icons/hi";
import TaskCard from "../components/TaskCard";
import ImportTaskModal from "../modals/ImportTaskModal";
import { useInfiniteScroll, useRequest, useToggle } from "ahooks";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import { FilterTasks, TASK_STATUS, TaskStatus } from "@/app/models/task.model";
import { Data } from "ahooks/lib/useInfiniteScroll/types";
import { TaskAPI } from "@/app/services/task.service";
import { ActiveTaskContext } from "../contexts/ActiveTaskContext";
import { useCustomSearchParams, useGetInstallationRepositories } from "@/app/utils/hooks";
import { GetRepositoryResourcesResponse } from "@/app/models/github.model";
import { GitHubAPI } from "@/app/services/github.service";
import SearchBox from "../components/SearchBox";
import { PaginationResponse } from "@/app/models/_global";
import { enumToStringConverter } from "@/app/utils/helper";

// ? Restrict filtering when task list is <= 10
const TaskListSection = () => {
    const { activeInstallation } = useInstallationStore();
    const { activeTask } = useContext(ActiveTaskContext);
    const [openImportTaskModal, { toggle: toggleImportTaskModal }] = useToggle(false);
    const [taskFilters, setTaskFilters] = useState(defaultTaskFilters);
    const [searchValue, setSearchValue] = useState("");
    const [displaySearchIcon, setDisplaySearchIcon] = useState(true);
    const {
        searchParams,
        updateSearchParams,
        removeSearchParams
    } = useCustomSearchParams();
    const installationChange = searchParams.get("installationChange");
    const refresh = searchParams.get("refresh");

    const {
        repositories: installationRepos,
        loading: loadingInstallationRepos
    } = useGetInstallationRepositories();

    // TODO: Implement caching
    const {
        data: installationTasks,
        loading: loadingTasks,
        loadingMore: loadingMoreTasks,
        noMore: noMoreTasks,
        loadMore: loadMoreTasks,
        reload: reloadTasks,
    } = useInfiniteScroll<Data>(
        async (currentData) => {
            if (!activeInstallation) {
                return { list: [], pagination: null }
            }

            const pageToLoad = currentData ? (currentData.pagination as PaginationResponse).currentPage + 1 : 1;
            let filters: FilterTasks = { 
                issueTitle: taskFilters.issueTitle,
                status: taskFilters.status
            };

            if (taskFilters.repoUrl) {
                filters = taskFilters;
            }

            const response = await TaskAPI.getInstallationTasks(
                activeInstallation.id,
                {
                    page: pageToLoad,
                    limit: 30,
                    ...filters,
                },
            );

            if (!searchParams.get("taskId") && !activeTask && response.data.length > 0) {
                updateSearchParams({ taskId: response.data[0].id }, true);
            } else {
                if (refresh === "true") {
                    removeSearchParams("refresh");
                }
            }

            return {
                list: response.data,
                pagination: response.pagination,
            };
        },
        {
            isNoMore: (data) => !data?.pagination?.hasMore,
            reloadDeps: [activeInstallation?.id, ...Object.values(taskFilters)]
        }
    );

    useEffect(() => {
        if (refresh === "true") {
            reloadTasks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh]);

    useEffect(() => {
        if (installationChange === "true") {
            setTaskFilters(defaultTaskFilters);
            reloadTasks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [installationChange]);

    const {
        loading: loadingResources,
        data: repoResources,
        run: fetchRepoResources
    } = useRequest<GetRepositoryResourcesResponse, any>(
        () => {
            return GitHubAPI.getRepositoryResources(
                activeInstallation!.id,
                taskFilters.repoUrl!
            ) as Promise<GetRepositoryResourcesResponse>;
        },
        {
            manual: true,
            retryCount: 1,
            cacheKey: `${taskFilters.repoUrl}-resources`,
            refreshDeps: [taskFilters.repoUrl]
        }
    );

    useEffect(() => {
        if (taskFilters.repoUrl) {
            fetchRepoResources();;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskFilters.repoUrl]);

    return (
        <>
            <section className="min-w-[366px] w-[12%] h-full pt-[30px] flex flex-col">
                <div className="pr-5 flex items-center justify-between">
                    <h6 className="text-headline-small text-light-100">Project Tasks</h6>
                    <button
                        className="flex items-center gap-[5px] text-primary-100 text-button-large font-extrabold hover:text-light-100"
                        onClick={toggleImportTaskModal}
                    >
                        <span>Import Tasks</span>
                        <HiPlus className="text-2xl" />
                    </button>
                </div>
                <div className="space-y-2.5 pr-5 my-[30px]">
                    <SearchBox
                        attributes={{
                            style: { fontSize: "12px", height: "40px" },
                            placeholder: "Search tasks by issue title",
                            name: "search",
                            value: searchValue,
                            onChange: (e) => {
                                setSearchValue(e.target.value);
                                if (!displaySearchIcon) setDisplaySearchIcon(true);
                            },
                            disabled: loadingTasks,
                        }}
                        extendedContainerClassName="w-full"
                        extendedInputClassName="text-body-tiny text-light-100"
                        enableSearchOption={Boolean(searchValue.trim().length > 2)}
                        displaySearchIcon={!Boolean(taskFilters.issueTitle) || displaySearchIcon}
                        onSearchIconClick={() => {
                            setTaskFilters((prev) => ({
                                ...prev,
                                issueTitle: searchValue.trim()
                            }));
                            setDisplaySearchIcon(false);
                        }}
                        onClearIconClick={() => {
                            setTaskFilters((prev) => ({
                                ...prev,
                                issueTitle: undefined
                            }));
                            setSearchValue("");
                        }}
                    />
                    <div className="flex items-center gap-2.5">
                        <FilterDropdown
                            title="Status"
                            options={Object.entries(TASK_STATUS).map(
                                ([key, value]) => ({ name: enumToStringConverter(key), value })
                            )}
                            fieldName="name"
                            fieldValue="value"
                            extendedContainerClassName="w-full"
                            extendedButtonClassName="w-full py-[5px]"
                            buttonAttributes={{
                                style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                disabled: loadingTasks
                            }}
                            setField={(value) => setTaskFilters((prev) => ({
                                ...prev,
                                status: value as TaskStatus,
                            }))}
                            defaultValue={taskFilters.status}
                            noMultiSelect
                        />
                        <FilterDropdown
                            title="Repo Name"
                            options={installationRepos}
                            fieldName="name"
                            fieldValue="url"
                            extendedContainerClassName="w-full"
                            extendedButtonClassName="w-full py-[5px]"
                            buttonAttributes={{
                                style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                disabled: loadingTasks || loadingInstallationRepos
                            }}
                            setField={(value) => setTaskFilters((prev) => ({
                                ...prev,
                                repoUrl: value as string,
                                issueLabels: undefined,
                            }))}
                            noMultiSelect
                        />
                        <FilterDropdown
                            title="Labels"
                            options={repoResources?.labels || []}
                            fieldName="name"
                            fieldValue="name"
                            extendedContainerClassName="w-full"
                            extendedButtonClassName="w-full py-[5px] border-dark-100 text-dark-100"
                            buttonAttributes={{
                                style: { fontSize: "12px", lineHeight: "16px", fontWeight: "700" },
                                disabled: loadingResources || !Boolean(taskFilters.repoUrl)
                            }}
                            setField={(value) => setTaskFilters((prev) => ({
                                ...prev,
                                issueLabels: value as string[]
                            }))}
                        />
                    </div>
                </div>
                <div className="grow pr-5 pb-5 overflow-y-auto space-y-[15px]">
                    {loadingTasks ? (
                        <div className="flex justify-center py-4">
                            <span className="text-body-medium text-light-100">Loading tasks...</span>
                        </div>
                    ):(
                        installationTasks?.list?.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                active={(activeTask?.id || searchParams.get("taskId")) === task.id}
                                onClick={() => updateSearchParams({ taskId: task.id })}
                            />
                        ))
                    )}
                    {(installationTasks?.list && installationTasks.list.length < 1 && !loadingTasks) && (
                        <div className="flex justify-center py-4">
                            <span className="text-body-medium text-light-100">No tasks found</span>
                        </div>
                    )}
                    {loadingMoreTasks && (
                        <div className="flex justify-center pt-2.5">
                            <span className="text-body-medium text-light-100">Loading more tasks...</span>
                        </div>
                    )}
                    {(!loadingTasks && !loadingMoreTasks && !noMoreTasks) && (
                        <button
                            className="text-body-medium text-light-200 font-bold hover:text-light-100 pt-2.5"
                            onClick={loadMoreTasks}
                        >
                            Load More
                        </button>
                    )}
                </div>
            </section>

            {openImportTaskModal && (
                <ImportTaskModal
                    installationRepos={installationRepos}
                    loadingInstallationRepos={loadingInstallationRepos}
                    toggleModal={toggleImportTaskModal}
                    onSuccess={reloadTasks}
                />
            )}
        </>
    );
}

export default TaskListSection;

const defaultTaskFilters: FilterTasks = {
    status: undefined,
    repoUrl: undefined,
    issueTitle: undefined,
    issueLabels: undefined,
}