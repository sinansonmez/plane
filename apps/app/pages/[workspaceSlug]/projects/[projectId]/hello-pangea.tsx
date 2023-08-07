import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import DefaultLayout from "layouts/default-layout";
// services
import issuesService from "services/issues.service";
// types
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_ISSUES_LIST_WITH_PARAMS } from "constants/fetch-keys";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

const HelloPangea: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const params = {
    group_by: "state",
  };

  const { data: projectIssues } = useSWR(
    workspaceSlug && projectId && params
      ? PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params)
      : null,
    workspaceSlug && projectId && params
      ? () =>
          issuesService.getIssuesWithParams(workspaceSlug as string, projectId as string, params)
      : null
  ) as { data: any };

  console.log(projectIssues);

  if (!projectIssues) return null;

  return (
    <DefaultLayout>
      <DragDropContext onDragEnd={() => {}}>
        <div className="h-full w-full overflow-hidden">
          <div className="h-full w-full flex flex-col overflow-y-auto">
            <div className="flex gap-8 p-8 horizontal-scroll-enable h-full w-full overflow-x-scroll">
              {Object.keys(projectIssues).map((key) => (
                <Droppable key={key} droppableId={key}>
                  {(provided, snapshot) => (
                    <div
                      className="w-96 flex-shrink-0 space-y-4"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {projectIssues[key].map((issue: any, index: number) => (
                        <Draggable key={issue.id} draggableId={issue.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className="text-custom-text-200 text-sm p-3 bg-custom-background-80 rounded-md"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {issue.name}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </div>
      </DragDropContext>
    </DefaultLayout>
  );
};

export default HelloPangea;
