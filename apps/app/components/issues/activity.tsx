import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// hooks
import useEstimateOption from "hooks/use-estimate-option";
// components
import { CommentCard } from "components/issues/comment";
// ui
import { Loader } from "components/ui";
// icons
import {
  ArchiveOutlined,
  AttachFileOutlined,
  CalendarTodayOutlined,
  ChangeHistoryOutlined,
  ChatOutlined,
  ContrastOutlined,
  DatasetOutlined,
  GridViewOutlined,
  GroupOutlined,
  HistoryOutlined,
  LinkOutlined,
  SellOutlined,
  SignalCellularAltOutlined,
  SupervisedUserCircleOutlined,
} from "@mui/icons-material";
// helpers
import { renderShortDateWithYearFormat, timeAgo } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { ICurrentUserResponse, IIssueComment, IIssueLabels, MaterialIcon } from "types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY, PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

const activityDetails: {
  [key: string]: {
    message?: string;
    Icon: MaterialIcon;
  };
} = {
  assignee: {
    message: "removed the assignee",
    Icon: GroupOutlined,
  },
  assignees: {
    message: "added a new assignee",
    Icon: GroupOutlined,
  },
  blocks: {
    message: "marked this issue being blocked by",
    Icon: GroupOutlined,
  },
  blocking: {
    message: "marked this issue is blocking",
    Icon: GroupOutlined,
  },
  cycles: {
    message: "set the cycle to",
    Icon: ContrastOutlined,
  },
  estimate_point: {
    message: "set the estimate point to",
    Icon: ChangeHistoryOutlined,
  },
  labels: {
    Icon: SellOutlined,
  },
  modules: {
    message: "set the module to",
    Icon: DatasetOutlined,
  },
  state: {
    message: "set the state to",
    Icon: GridViewOutlined,
  },
  priority: {
    message: "set the priority to",
    Icon: SignalCellularAltOutlined,
  },
  name: {
    message: "set the name to",
    Icon: ChatOutlined,
  },
  description: {
    message: "updated the description.",
    Icon: ChatOutlined,
  },
  target_date: {
    message: "set the due date to",
    Icon: CalendarTodayOutlined,
  },
  parent: {
    message: "set the parent to",
    Icon: SupervisedUserCircleOutlined,
  },
  estimate: {
    message: "updated the estimate",
    Icon: ChangeHistoryOutlined,
  },
  link: {
    message: "updated the link",
    Icon: LinkOutlined,
  },
  attachment: {
    message: "updated the attachment",
    Icon: AttachFileOutlined,
  },
  archived_at: {
    message: "archived",
    Icon: ArchiveOutlined,
  },
};

type Props = {
  issueId: string;
  user: ICurrentUserResponse | undefined;
};

export const IssueActivitySection: React.FC<Props> = ({ issueId, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { isEstimateActive, estimatePoints } = useEstimateOption();

  const { data: issueActivities, mutate: mutateIssueActivities } = useSWR(
    workspaceSlug && projectId && issueId ? PROJECT_ISSUES_ACTIVITY(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.getIssueActivities(
            workspaceSlug as string,
            projectId as string,
            issueId as string
          )
      : null
  );

  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const handleCommentUpdate = async (comment: IIssueComment) => {
    if (!workspaceSlug || !projectId || !issueId) return;
    await issuesService
      .patchIssueComment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        comment.id,
        comment,
        user
      )
      .then((res) => {
        mutateIssueActivities();
      });
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    mutateIssueActivities((prevData) => prevData?.filter((p) => p.id !== commentId), false);

    await issuesService
      .deleteIssueComment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        commentId,
        user
      )
      .then(() => mutateIssueActivities());
  };

  const getLabelColor = (labelId: string) => {
    if (!issueLabels) return;

    const label = issueLabels.find((label) => label.id === labelId);

    if (typeof label !== "undefined") return label.color !== "" ? label.color : "#000000";

    return "#000000";
  };

  if (!issueActivities) {
    return (
      <Loader className="space-y-4">
        <div className="space-y-2">
          <Loader.Item height="30px" width="40%" />
          <Loader.Item height="15px" width="60%" />
        </div>
        <div className="space-y-2">
          <Loader.Item height="30px" width="40%" />
          <Loader.Item height="15px" width="60%" />
        </div>
        <div className="space-y-2">
          <Loader.Item height="30px" width="40%" />
          <Loader.Item height="15px" width="60%" />
        </div>
      </Loader>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-4">
        {issueActivities.map((activityItem, activityItemIdx) => {
          const activityType = activityDetails[activityItem.field as keyof typeof activityDetails];

          let message = activityType?.message;

          if (activityItem.field === "labels") {
            message = activityItem.new_value !== "" ? "added a new label" : "removed the label";
          } else if (activityItem.field === "blocking") {
            message =
              activityItem.new_value !== ""
                ? "marked this issue is blocking"
                : "removed the issue from blocking";
          } else if (activityItem.field === "blocks") {
            message =
              activityItem.new_value !== ""
                ? "marked this issue being blocked by"
                : "removed blocker";
          } else if (activityItem.field === "target_date") {
            message =
              activityItem.new_value && activityItem.new_value !== ""
                ? "set the due date to"
                : "removed the due date";
          } else if (activityItem.field === "parent") {
            message =
              activityItem.new_value && activityItem.new_value !== ""
                ? "set the parent to"
                : "removed the parent";
          } else if (activityItem.field === "priority") {
            message =
              activityItem.new_value && activityItem.new_value !== ""
                ? "set the priority to"
                : "removed the priority";
          } else if (activityItem.field === "description") {
            message = "updated the";
          } else if (activityItem.field === "attachment") {
            message = `${activityItem.verb} the`;
          } else if (activityItem.field === "link") {
            message = `${activityItem.verb} the`;
          } else if (activityItem.field === "estimate") {
            message = "updated the";
          } else if (activityItem.field === "cycles") {
            message =
              activityItem.new_value && activityItem.new_value !== ""
                ? "set the cycle to"
                : "removed the cycle";
          } else if (activityItem.field === "modules") {
            message =
              activityItem.new_value && activityItem.new_value !== ""
                ? "set the module to"
                : "removed the module";
          } else if (activityItem.field === "archived_at") {
            message =
              activityItem.new_value && activityItem.new_value === "restore"
                ? "restored the issue"
                : "archived the issue";
          }
          // for values that are after the action clause
          let value: any = activityItem.new_value ? activityItem.new_value : activityItem.old_value;
          if (
            activityItem.verb === "created" &&
            activityItem.field !== "cycles" &&
            activityItem.field !== "modules" &&
            activityItem.field !== "attachment" &&
            activityItem.field !== "link" &&
            activityItem.field !== "estimate"
          ) {
            value = <span className="text-custom-text-200">created this issue.</span>;
          } else if (activityItem.field === "state") {
            value = activityItem.new_value ? addSpaceIfCamelCase(activityItem.new_value) : "None";
          } else if (activityItem.field === "labels") {
            let name;
            let id = "#000000";
            if (activityItem.new_value !== "") {
              name = activityItem.new_value;
              id = activityItem.new_identifier ? activityItem.new_identifier : id;
            } else {
              name = activityItem.old_value;
              id = activityItem.old_identifier ? activityItem.old_identifier : id;
            }

            value = (
              <span className="relative inline-flex items-center rounded-full border border-custom-border-200 px-2 py-0.5 text-xs">
                <span className="absolute flex flex-shrink-0 items-center justify-center">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: getLabelColor(id),
                    }}
                    aria-hidden="true"
                  />
                </span>
                <span className="ml-3 font-medium text-custom-text-100">{name}</span>
              </span>
            );
          } else if (activityItem.field === "assignees") {
            value = activityItem.new_value;
          } else if (activityItem.field === "target_date") {
            const date =
              activityItem.new_value && activityItem.new_value !== ""
                ? activityItem.new_value
                : activityItem.old_value;
            value = renderShortDateWithYearFormat(date as string);
          } else if (activityItem.field === "description") {
            value = "description";
          } else if (activityItem.field === "attachment") {
            value = "attachment";
          } else if (activityItem.field === "cycles") {
            const cycles =
              activityItem.new_value && activityItem.new_value !== ""
                ? activityItem.new_value
                : activityItem.old_value;
            value = cycles ? addSpaceIfCamelCase(cycles) : "None";
          } else if (activityItem.field === "modules") {
            const modules =
              activityItem.new_value && activityItem.new_value !== ""
                ? activityItem.new_value
                : activityItem.old_value;
            value = modules ? addSpaceIfCamelCase(modules) : "None";
          } else if (activityItem.field === "link") {
            value = "link";
          } else if (activityItem.field === "estimate_point") {
            value = activityItem.new_value
              ? isEstimateActive
                ? estimatePoints.find((e) => e.key === parseInt(activityItem.new_value ?? "", 10))
                    ?.value
                : activityItem.new_value +
                  ` Point${parseInt(activityItem.new_value ?? "", 10) > 1 ? "s" : ""}`
              : "None";
          }

          if ("field" in activityItem && activityItem.field !== "updated_by") {
            return (
              <li key={activityItem.id}>
                <div className="relative pb-1">
                  {issueActivities.length > 1 && activityItemIdx !== issueActivities.length - 1 ? (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-custom-background-80"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-2">
                    <>
                      <div>
                        <div className="relative px-1.5">
                          <div className="mt-1.5">
                            <div className="ring-6 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-80 text-custom-text-200 ring-white">
                              {activityItem.field ? (
                                activityItem.new_value === "restore" ? (
                                  <HistoryOutlined
                                    sx={{
                                      fontSize: 14,
                                    }}
                                  />
                                ) : (
                                  <activityType.Icon
                                    sx={{
                                      fontSize: 14,
                                    }}
                                  />
                                )
                              ) : activityItem.actor_detail.avatar &&
                                activityItem.actor_detail.avatar !== "" ? (
                                <img
                                  src={activityItem.actor_detail.avatar}
                                  alt={activityItem.actor_detail.first_name}
                                  height={24}
                                  width={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div
                                  className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-700 text-xs text-white`}
                                >
                                  {activityItem.actor_detail.first_name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 py-3">
                        <div className="text-xs text-custom-text-200">
                          {activityItem.field === "archived_at" &&
                          activityItem.new_value !== "restore" ? (
                            <span className="text-gray font-medium">Plane</span>
                          ) : (
                            <span className="text-gray font-medium">
                              {activityItem.actor_detail.first_name}
                              {activityItem.actor_detail.is_bot
                                ? " Bot"
                                : " " + activityItem.actor_detail.last_name}
                            </span>
                          )}
                          <span> {message} </span>
                          {activityItem.field !== "archived_at" && (
                            <span className="text-xs font-medium text-custom-text-100">
                              {" "}
                              {value}{" "}
                            </span>
                          )}
                          <span className="whitespace-nowrap">
                            {timeAgo(activityItem.created_at)}
                          </span>
                        </div>
                      </div>
                    </>
                  </div>
                </div>
              </li>
            );
          } else if ("comment_json" in activityItem)
            return (
              <div key={activityItem.id} className="mt-4">
                <CommentCard
                  comment={activityItem as any}
                  onSubmit={handleCommentUpdate}
                  handleCommentDeletion={handleCommentDelete}
                />
              </div>
            );
        })}
      </ul>
    </div>
  );
};
