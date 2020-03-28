import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { Player } from '@/scripts/types'
import Players from '@/views/user/Players'

jest.mock('@/scripts/net')

const fixture: Readonly<Player> = Object.freeze<Player>({
  pid: 1,
  name: 'kumiko',
  tid_skin: 1,
  tid_cape: 2,
})

beforeEach(() => {
  const container = document.createElement('div')
  container.id = 'previewer'
  document.body.appendChild(container)

  blessing.extra = {
    rule: 'please follow the rule',
    length: 'greater than 3',
    score: 1000,
    cost: 50,
  }
})

afterEach(() => {
  document.querySelector('#previewer')!.remove()
})

test('loading indicator', () => {
  fetch.get.mockResolvedValue({ data: [] })
  const { queryByTitle } = render(<Players />)
  expect(queryByTitle('Loading...')).toBeInTheDocument()
})

test('search players', async () => {
  const fixture2: Player = { pid: 2, name: 'reina', tid_skin: 3, tid_cape: 4 }
  fetch.get.mockResolvedValue({ data: [fixture, fixture2] })

  const { getByPlaceholderText, queryByText } = render(<Players />)
  await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

  fireEvent.input(getByPlaceholderText(t('user.typeToSearch')), {
    target: { value: 'k' },
  })

  expect(queryByText(fixture.name)).toBeInTheDocument()
  expect(queryByText(fixture2.name)).not.toBeInTheDocument()
})

describe('select player automatically', () => {
  it('only one player', async () => {
    fetch.get.mockResolvedValue({ data: [fixture] })
    render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    expect(fetch.get).toBeCalledWith(`/skinlib/info/${fixture.tid_skin}`)
    expect(fetch.get).toBeCalledWith(`/skinlib/info/${fixture.tid_cape}`)
  })

  it('more players', async () => {
    const fixture2: Player = { pid: 2, name: 'reina', tid_skin: 3, tid_cape: 4 }
    fetch.get.mockResolvedValue({ data: [fixture, fixture2] })
    render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    expect(fetch.get).not.toBeCalledWith(`/skinlib/info/${fixture.tid_skin}`)
    expect(fetch.get).not.toBeCalledWith(`/skinlib/info/${fixture.tid_cape}`)
  })
})

describe('2d preview', () => {
  it('skin and cape', async () => {
    fetch.get
      .mockResolvedValueOnce({ data: [fixture] })
      .mockResolvedValueOnce({ data: { hash: 'a', type: 'steve' } })
      .mockResolvedValueOnce({ data: { hash: 'b', type: 'cape' } })

    const { getByAltText, getByText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.switch2dPreview')))

    expect(getByAltText(t('general.skin'))).toHaveAttribute(
      'src',
      `${blessing.base_url}/textures/a`,
    )
    expect(getByAltText(t('general.cape'))).toHaveAttribute(
      'src',
      `${blessing.base_url}/textures/b`,
    )
  })

  it('skin only', async () => {
    fetch.get
      .mockResolvedValueOnce({ data: [{ ...fixture, tid_cape: 0 }] })
      .mockResolvedValueOnce({ data: { hash: 'a', type: 'steve' } })

    const { getByAltText, queryByAltText, getByText, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.switch2dPreview')))

    expect(getByAltText(t('general.skin'))).toHaveAttribute(
      'src',
      `${blessing.base_url}/textures/a`,
    )
    expect(queryByAltText(t('general.cape'))).not.toBeInTheDocument()
    expect(queryByText(t('user.player.texture-empty'))).toBeInTheDocument()
  })

  it('cape only', async () => {
    fetch.get
      .mockResolvedValueOnce({ data: [{ ...fixture, tid_skin: 0 }] })
      .mockResolvedValueOnce({ data: { hash: 'a', type: 'cape' } })

    const { getByAltText, queryByAltText, getByText, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.switch2dPreview')))

    expect(getByAltText(t('general.cape'))).toHaveAttribute(
      'src',
      `${blessing.base_url}/textures/a`,
    )
    expect(queryByAltText(t('general.skin'))).not.toBeInTheDocument()
    expect(queryByText(t('user.player.texture-empty'))).toBeInTheDocument()
  })
})

describe('create player', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue({ data: [] })
  })

  it('alert if score is enough', async () => {
    const { getByRole, getByText, queryByText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.add-player')))

    expect(
      queryByText(`${t('user.cur-score')} ${blessing.extra.score}`),
    ).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-success')
  })

  it('alert if lack of score', async () => {
    blessing.extra.score = 0
    const { getByRole, getByText, queryByText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.add-player')))

    expect(
      queryByText(`${t('user.cur-score')} ${blessing.extra.score}`),
    ).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
  })

  it('succeeded', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success', data: fixture })

    const { getByText, getByLabelText, getByRole, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.add-player')))
    fireEvent.input(getByLabelText(t('general.player.player-name')), {
      target: { value: fixture.name },
    })
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith('/user/player/add', {
        name: fixture.name,
      }),
    )
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
    expect(queryByText(fixture.pid.toString())).toBeInTheDocument()
    expect(queryByText(fixture.name)).toBeInTheDocument()
  })

  it('failed', async () => {
    fetch.post.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByLabelText, getByRole, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.add-player')))
    fireEvent.input(getByLabelText(t('general.player.player-name')), {
      target: { value: fixture.name },
    })
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith('/user/player/add', {
        name: fixture.name,
      }),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
    expect(queryByText(fixture.name)).not.toBeInTheDocument()
  })

  it('cancelled', async () => {
    const { getByText, getByLabelText, queryByText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.add-player')))
    fireEvent.input(getByLabelText(t('general.player.player-name')), {
      target: { value: fixture.name },
    })
    fireEvent.click(getByText(t('general.cancel')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
    expect(queryByText(fixture.name)).not.toBeInTheDocument()
  })

  it('clear form on close', async () => {
    const { getByText, getByLabelText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.add-player')))
    fireEvent.input(getByLabelText(t('general.player.player-name')), {
      target: { value: fixture.name },
    })
    fireEvent.click(getByText(t('general.cancel')))
    fireEvent.click(getByText(t('user.player.add-player')))

    expect(getByLabelText(t('general.player.player-name'))).toHaveValue('')
  })
})

describe('edit player name', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue({ data: [fixture] })
  })

  it('succeeded', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const {
      getByText,
      getByTitle,
      getByDisplayValue,
      getByRole,
      queryByText,
    } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByTitle(t('user.player.edit-pname')))
    fireEvent.input(getByDisplayValue(fixture.name), {
      target: { value: 'reina' },
    })
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(`/user/player/rename/${fixture.pid}`, {
        name: 'reina',
      }),
    )
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
    expect(queryByText('reina')).toBeInTheDocument()
  })

  it('empty name', async () => {
    const { getByText, getByTitle, getByDisplayValue, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByTitle(t('user.player.edit-pname')))
    fireEvent.input(getByDisplayValue(fixture.name), {
      target: { value: '' },
    })
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
    expect(queryByText(t('user.emptyPlayerName'))).toBeInTheDocument()

    fireEvent.click(getByText(t('general.cancel')))
  })

  it('failed', async () => {
    fetch.post.mockResolvedValue({ code: 1, message: 'failed' })

    const {
      getByText,
      getByTitle,
      getByDisplayValue,
      getByRole,
      queryByText,
    } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByTitle(t('user.player.edit-pname')))
    fireEvent.input(getByDisplayValue(fixture.name), {
      target: { value: 'reina' },
    })
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(`/user/player/rename/${fixture.pid}`, {
        name: 'reina',
      }),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
    expect(queryByText(fixture.name)).toBeInTheDocument()
  })

  it('cancelled', async () => {
    const { getByText, getByTitle, getByDisplayValue, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByTitle(t('user.player.edit-pname')))
    fireEvent.input(getByDisplayValue(fixture.name), {
      target: { value: 'reina' },
    })
    fireEvent.click(getByText(t('general.cancel')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
    expect(queryByText(fixture.name)).toBeInTheDocument()
  })
})

describe('reset texture', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue({ data: [fixture] })
  })

  it('clear skin and cape', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const { getByText, getByRole, getByLabelText, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-texture')))
    fireEvent.click(getByLabelText(t('general.skin')))
    fireEvent.click(getByLabelText(t('general.cape')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/player/texture/clear/${fixture.pid}`,
        {
          type: ['skin', 'cape'],
        },
      ),
    )
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
  })

  it('clear skin', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const { getByText, getByRole, getByLabelText, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-texture')))
    fireEvent.click(getByLabelText(t('general.skin')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/player/texture/clear/${fixture.pid}`,
        {
          type: ['skin'],
        },
      ),
    )
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
  })

  it('clear cape', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const { getByText, getByRole, getByLabelText, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-texture')))
    fireEvent.click(getByLabelText(t('general.cape')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/player/texture/clear/${fixture.pid}`,
        {
          type: ['cape'],
        },
      ),
    )
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
  })

  it('select nothing', async () => {
    const { getByText, getByRole, queryByText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-texture')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
    expect(queryByText(t('user.noClearChoice'))).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-warning')
  })

  it('failed', async () => {
    fetch.post.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByRole, getByLabelText, queryByText } = render(
      <Players />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-texture')))
    fireEvent.click(getByLabelText(t('general.skin')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/player/texture/clear/${fixture.pid}`,
        {
          type: ['skin'],
        },
      ),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
  })

  it('cancelled', async () => {
    const { getByText, getByLabelText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-texture')))
    fireEvent.click(getByLabelText(t('general.skin')))
    fireEvent.click(getByText(t('general.cancel')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
  })
})

describe('delete player', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue({ data: [fixture] })
  })

  it('succeeded', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const { getByText, getByRole, queryByText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-player')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(`/user/player/delete/${fixture.pid}`),
    )
    expect(getByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
    expect(queryByText(fixture.name)).not.toBeInTheDocument()
  })

  it('failed', async () => {
    fetch.post.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByRole, queryByText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-player')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(`/user/player/delete/${fixture.pid}`),
    )
    expect(getByText('failed')).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
    expect(queryByText(fixture.name)).toBeInTheDocument()
  })

  it('cancelled', async () => {
    const { getByText, queryByText } = render(<Players />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.player.delete-player')))
    fireEvent.click(getByText(t('general.cancel')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
    expect(queryByText(fixture.name)).toBeInTheDocument()
  })
})
