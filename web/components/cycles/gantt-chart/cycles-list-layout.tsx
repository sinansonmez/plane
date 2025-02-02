import { FC } from "react";

import { useRouter } from "next/router";

import { KeyedMutator } from "swr";

// services
import cyclesService from "services/cycles.service";
// hooks
import useUser from "hooks/use-user";
import useProjectDetails from "hooks/use-project-details";
// components
import { GanttChartRoot, IBlockUpdateData } from "components/gantt-chart";
import { CycleGanttBlock, CycleGanttSidebarBlock } from "components/cycles";
// types
import { ICycle } from "types";

type Props = {
  cycles: ICycle[];
  mutateCycles: KeyedMutator<ICycle[]>;
};

export const CyclesListGanttChartView: FC<Props> = ({ cycles, mutateCycles }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUser();
  const { projectDetails } = useProjectDetails();

  const handleCycleUpdate = (cycle: ICycle, payload: IBlockUpdateData) => {
    if (!workspaceSlug || !user) return;

    mutateCycles((prevData: any) => {
      if (!prevData) return prevData;

      const newList = prevData.map((p: any) => ({
        ...p,
        ...(p.id === cycle.id
          ? {
              start_date: payload.start_date ? payload.start_date : p.start_date,
              target_date: payload.target_date ? payload.target_date : p.end_date,
              sort_order: payload.sort_order ? payload.sort_order.newSortOrder : p.sort_order,
            }
          : {}),
      }));

      if (payload.sort_order) {
        const removedElement = newList.splice(payload.sort_order.sourceIndex, 1)[0];
        newList.splice(payload.sort_order.destinationIndex, 0, removedElement);
      }

      return newList;
    }, false);

    const newPayload: any = { ...payload };

    if (newPayload.sort_order && payload.sort_order)
      newPayload.sort_order = payload.sort_order.newSortOrder;

    cyclesService.patchCycle(workspaceSlug.toString(), cycle.project, cycle.id, newPayload, user);
  };

  const blockFormat = (blocks: ICycle[]) =>
    blocks && blocks.length > 0
      ? blocks
          .filter((b) => b.start_date && b.end_date)
          .map((block) => ({
            data: block,
            id: block.id,
            sort_order: block.sort_order,
            start_date: new Date(block.start_date ?? ""),
            target_date: new Date(block.end_date ?? ""),
          }))
      : [];

  const isAllowed = projectDetails?.member_role === 20 || projectDetails?.member_role === 15;

  return (
    <div className="w-full h-full overflow-y-auto">
      <GanttChartRoot
        title="Cycles"
        loaderTitle="Cycles"
        blocks={cycles ? blockFormat(cycles) : null}
        blockUpdateHandler={(block, payload) => handleCycleUpdate(block, payload)}
        SidebarBlockRender={CycleGanttSidebarBlock}
        BlockRender={CycleGanttBlock}
        enableBlockLeftResize={false}
        enableBlockRightResize={false}
        enableBlockMove={false}
        enableReorder={isAllowed}
      />
    </div>
  );
};
