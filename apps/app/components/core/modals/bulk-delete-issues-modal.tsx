import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import issuesServices from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
import useIssuesView from "hooks/use-issues-view";
import useCalendarIssuesView from "hooks/use-calendar-issues-view";
// components
import { ExistingIssuesListModal } from "components/core";
// types
import { ICurrentUserResponse, ISearchIssueResponse } from "types";
// fetch keys
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  VIEW_ISSUES,
} from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: ICurrentUserResponse | undefined;
};

export const BulkDeleteIssuesModal: React.FC<Props> = ({ isOpen, setIsOpen, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { setToastAlert } = useToast();
  const { issueView, params } = useIssuesView();
  const { params: calendarParams } = useCalendarIssuesView();
  const { order_by, group_by, ...viewGanttParams } = params;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDelete = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const payload = {
      delete_issue_ids: data.map((i) => i.id),
    };

    const calendarFetchKey = cycleId
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), calendarParams)
      : moduleId
      ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), calendarParams)
      : viewId
      ? VIEW_ISSUES(viewId.toString(), calendarParams)
      : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId?.toString() ?? "", calendarParams);

    const ganttFetchKey = cycleId
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString())
      : moduleId
      ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString())
      : viewId
      ? VIEW_ISSUES(viewId.toString(), viewGanttParams)
      : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId?.toString() ?? "");

    await issuesServices
      .bulkDeleteIssues(
        workspaceSlug as string,
        projectId as string,
        {
          issue_ids: payload.delete_issue_ids,
        },
        user
      )
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issues deleted successfully!",
        });

        if (issueView === "calendar") mutate(calendarFetchKey);
        else if (issueView === "gantt_chart") mutate(ganttFetchKey);
        else {
          if (cycleId) {
            mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params));
            mutate(CYCLE_DETAILS(cycleId.toString()));
          } else if (moduleId) {
            mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
            mutate(MODULE_DETAILS(moduleId as string));
          } else mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params));
        }

        handleClose();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      );
  };

  return (
    <ExistingIssuesListModal
      isOpen={isOpen}
      handleClose={handleClose}
      searchParams={{}}
      handleOnSubmit={handleDelete}
      primaryButton={{
        loadingText: "Deleting...",
        defaultText: "Delete",
        buttonType: "danger",
      }}
    />
  );
};
