import { AssetId, ProjectId, UnixTime } from '@l2beat/types'
import { expect } from 'earljs'

import { aggregateReports } from '../../../src/core/reports/aggregateReports'
import { ReportProject } from '../../../src/core/reports/ReportProject'
import { AggregateReportRecord } from '../../../src/peripherals/database/AggregateReportRepository'
import { ReportRecord } from '../../../src/peripherals/database/ReportRepository'

describe(aggregateReports.name, () => {
  const NOW = UnixTime.now().toStartOf('hour')
  const ETH_PRICE_IN_DAI = 1_000n

  const ARBITRUM = ProjectId('arbitrum')
  const OPTIMISM = ProjectId('optimism')
  const POLYGON = ProjectId('polygon')
  const AVALANCHE = ProjectId('avalanche')

  it('correctly aggregates many reports', () => {
    const result = aggregateReports(
      [
        report(ARBITRUM, 'eth', 30n),
        report(ARBITRUM, 'dai', 5_000n),
        report(OPTIMISM, 'eth', 20n),
        report(POLYGON, 'dai', 1_000n),
        report(AVALANCHE, 'eth', 40n),
      ],
      [
        project(ARBITRUM, 'layer2'),
        project(OPTIMISM, 'layer2'),
        project(POLYGON, 'bridge'),
        project(AVALANCHE, 'bridge'),
      ],
      NOW,
    )
    expect(result).toEqual([
      record(ARBITRUM, 35_000n),
      record(OPTIMISM, 20_000n),
      record(POLYGON, 1_000n),
      record(AVALANCHE, 40_000n),
      record(ProjectId.ALL, 96_000n),
      record(ProjectId.BRIDGES, 41_000n),
      record(ProjectId.LAYER2S, 55_000n),
    ])
  })

  it('works with empty reports', () => {
    const result = aggregateReports(
      [],
      [
        project(ARBITRUM, 'layer2'),
        project(OPTIMISM, 'layer2'),
        project(POLYGON, 'bridge'),
        project(AVALANCHE, 'bridge'),
      ],
      NOW,
    )
    expect(result).toEqual([
      record(ARBITRUM, 0n),
      record(OPTIMISM, 0n),
      record(POLYGON, 0n),
      record(AVALANCHE, 0n),
      record(ProjectId.ALL, 0n),
      record(ProjectId.BRIDGES, 0n),
      record(ProjectId.LAYER2S, 0n),
    ])
  })

  function report(
    projectId: ProjectId,
    asset: 'eth' | 'dai',
    balance: bigint,
  ): ReportRecord {
    return {
      timestamp: NOW,
      projectId,
      asset: asset === 'eth' ? AssetId.ETH : AssetId.DAI,
      balance: balance * 10n ** 18n,
      balanceUsd:
        (asset === 'eth' ? balance * ETH_PRICE_IN_DAI : balance) * 100n,
      balanceEth:
        (asset === 'eth' ? balance : balance / ETH_PRICE_IN_DAI) * 1000000n,
    }
  }

  function project(
    projectId: ProjectId,
    type: ReportProject['type'],
  ): ReportProject {
    return { projectId, type, escrows: [] }
  }

  function record(projectId: ProjectId, usdTVL: bigint): AggregateReportRecord {
    return {
      timestamp: NOW,
      projectId,
      tvlUsd: usdTVL * 100n,
      tvlEth: usdTVL * 1000n,
    }
  }
})
